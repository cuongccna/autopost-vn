--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2025-11-13 21:46:48

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3 (class 3079 OID 40793)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5328 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 2 (class 3079 OID 40782)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5329 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 305 (class 1255 OID 41204)
-- Name: check_ai_rate_limit(uuid, character varying); Type: FUNCTION; Schema: public; Owner: autopost_admin
--

CREATE FUNCTION public.check_ai_rate_limit(p_user_id uuid, p_user_role character varying) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
    daily_usage INTEGER;
    monthly_usage INTEGER;
    daily_limit INTEGER;
    monthly_limit INTEGER;
    result JSON;
BEGIN
    -- Get rate limits for user role with explicit debugging
    SELECT rl.daily_limit, rl.monthly_limit 
    INTO daily_limit, monthly_limit
    FROM public.autopostvn_ai_rate_limits rl
    WHERE rl.user_role = p_user_role;
    
    -- If no limits found for specific role, default to free tier
    IF daily_limit IS NULL THEN
        SELECT rl.daily_limit, rl.monthly_limit 
        INTO daily_limit, monthly_limit
        FROM public.autopostvn_ai_rate_limits rl
        WHERE rl.user_role = 'free';
    END IF;
    
    -- If still no limits found, set explicit defaults (should not happen)
    IF daily_limit IS NULL THEN
        daily_limit := 0;
        monthly_limit := 0;
    END IF;
    
    -- Get current usage
    daily_usage := get_user_ai_usage(p_user_id, 'daily');
    monthly_usage := get_user_ai_usage(p_user_id, 'monthly');
    
    -- Check limits (-1 means unlimited)
    result := json_build_object(
        'allowed', CASE 
            WHEN daily_limit = -1 AND monthly_limit = -1 THEN TRUE
            WHEN daily_limit = -1 THEN monthly_usage < monthly_limit
            WHEN monthly_limit = -1 THEN daily_usage < daily_limit
            ELSE daily_usage < daily_limit AND monthly_usage < monthly_limit
        END,
        'daily_usage', daily_usage,
        'daily_limit', daily_limit,
        'monthly_usage', monthly_usage,
        'monthly_limit', monthly_limit,
        'user_role', p_user_role
    );
    
    RETURN result;
END;
$$;


ALTER FUNCTION public.check_ai_rate_limit(p_user_id uuid, p_user_role character varying) OWNER TO autopost_admin;

--
-- TOC entry 302 (class 1255 OID 41201)
-- Name: check_post_rate_limit(uuid, character varying); Type: FUNCTION; Schema: public; Owner: autopost_admin
--

CREATE FUNCTION public.check_post_rate_limit(p_user_id uuid, p_user_role character varying DEFAULT 'free'::character varying) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_monthly_usage INTEGER;
    v_daily_usage INTEGER;
    v_monthly_limit INTEGER;
    v_daily_limit INTEGER;
    v_current_month DATE;
    v_current_date DATE;
    v_result JSON;
BEGIN
    -- Get current month and date
    v_current_month := DATE_TRUNC('month', NOW());
    v_current_date := DATE_TRUNC('day', NOW());
    
    -- Get monthly usage for current month
    SELECT COALESCE(COUNT(*), 0)
    INTO v_monthly_usage
    FROM public.autopostvn_post_usage
    WHERE user_id = p_user_id
    AND DATE_TRUNC('month', created_at) = v_current_month
    AND status IN ('published', 'scheduled');
    
    -- Get daily usage for today
    SELECT COALESCE(COUNT(*), 0)
    INTO v_daily_usage
    FROM public.autopostvn_post_usage
    WHERE user_id = p_user_id
    AND DATE_TRUNC('day', created_at) = v_current_date
    AND status IN ('published', 'scheduled');
    
    -- Get limits for user role
    SELECT monthly_limit, daily_limit
    INTO v_monthly_limit, v_daily_limit
    FROM public.autopostvn_post_rate_limits
    WHERE user_role = p_user_role;
    
    -- If no limit found, default to free tier
    IF v_monthly_limit IS NULL THEN
        SELECT monthly_limit, daily_limit
        INTO v_monthly_limit, v_daily_limit
        FROM public.autopostvn_post_rate_limits
        WHERE user_role = 'free';
    END IF;
    
    -- Build result JSON
    v_result := json_build_object(
        'allowed', CASE 
            WHEN v_monthly_limit = -1 AND v_daily_limit = -1 THEN true
            WHEN v_monthly_limit = -1 THEN v_daily_usage < v_daily_limit
            WHEN v_daily_limit = -1 THEN v_monthly_usage < v_monthly_limit
            ELSE v_monthly_usage < v_monthly_limit AND v_daily_usage < v_daily_limit
        END,
        'monthly_usage', v_monthly_usage,
        'monthly_limit', v_monthly_limit,
        'daily_usage', v_daily_usage,
        'daily_limit', v_daily_limit,
        'user_role', p_user_role
    );
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION public.check_post_rate_limit(p_user_id uuid, p_user_role character varying) OWNER TO autopost_admin;

--
-- TOC entry 5330 (class 0 OID 0)
-- Dependencies: 302
-- Name: FUNCTION check_post_rate_limit(p_user_id uuid, p_user_role character varying); Type: COMMENT; Schema: public; Owner: autopost_admin
--

COMMENT ON FUNCTION public.check_post_rate_limit(p_user_id uuid, p_user_role character varying) IS 'Checks if user can create a new post based on their role and current usage (includes daily limits)';


--
-- TOC entry 289 (class 1255 OID 41128)
-- Name: cleanup_expired_oauth_sessions(); Type: FUNCTION; Schema: public; Owner: autopost_admin
--

CREATE FUNCTION public.cleanup_expired_oauth_sessions() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM autopostvn_oauth_sessions 
    WHERE expires_at < NOW();
END;
$$;


ALTER FUNCTION public.cleanup_expired_oauth_sessions() OWNER TO autopost_admin;

--
-- TOC entry 288 (class 1255 OID 41063)
-- Name: create_analytics_event(uuid, text, jsonb, uuid, uuid); Type: FUNCTION; Schema: public; Owner: autopost_admin
--

CREATE FUNCTION public.create_analytics_event(p_workspace_id uuid, p_event_type text, p_event_data jsonb, p_post_id uuid DEFAULT NULL::uuid, p_social_account_id uuid DEFAULT NULL::uuid) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
declare
  event_id uuid;
begin
  insert into public.autopostvn_analytics_events (workspace_id, event_type, event_data, post_id, social_account_id)
  values (p_workspace_id, p_event_type, p_event_data, p_post_id, p_social_account_id)
  returning id into event_id;
  
  return event_id;
end;
$$;


ALTER FUNCTION public.create_analytics_event(p_workspace_id uuid, p_event_type text, p_event_data jsonb, p_post_id uuid, p_social_account_id uuid) OWNER TO autopost_admin;

--
-- TOC entry 290 (class 1255 OID 41174)
-- Name: get_user_ai_usage(uuid, character varying); Type: FUNCTION; Schema: public; Owner: autopost_admin
--

CREATE FUNCTION public.get_user_ai_usage(p_user_id uuid, p_period character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    usage_count INTEGER;
BEGIN
    IF p_period = 'daily' THEN
        SELECT COUNT(*) INTO usage_count
        FROM public.autopostvn_ai_usage
        WHERE user_id = p_user_id 
        AND request_date = CURRENT_DATE
        AND success = TRUE;
    ELSIF p_period = 'monthly' THEN
        SELECT COUNT(*) INTO usage_count
        FROM public.autopostvn_ai_usage
        WHERE user_id = p_user_id 
        AND DATE_TRUNC('month', request_date) = DATE_TRUNC('month', CURRENT_DATE)
        AND success = TRUE;
    ELSE
        usage_count := 0;
    END IF;
    
    RETURN COALESCE(usage_count, 0);
END;
$$;


ALTER FUNCTION public.get_user_ai_usage(p_user_id uuid, p_period character varying) OWNER TO autopost_admin;

--
-- TOC entry 303 (class 1255 OID 41202)
-- Name: get_user_post_usage(uuid, character varying); Type: FUNCTION; Schema: public; Owner: autopost_admin
--

CREATE FUNCTION public.get_user_post_usage(p_user_id uuid, p_user_role character varying DEFAULT 'free'::character varying) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_monthly_usage INTEGER;
    v_monthly_limit INTEGER;
    v_daily_limit INTEGER;
    v_current_month DATE;
    v_this_week INTEGER;
    v_today INTEGER;
    v_result JSON;
BEGIN
    -- Get current month start
    v_current_month := DATE_TRUNC('month', NOW());
    
    -- Get monthly usage
    SELECT COALESCE(COUNT(*), 0)
    INTO v_monthly_usage
    FROM public.autopostvn_post_usage
    WHERE user_id = p_user_id
    AND DATE_TRUNC('month', created_at) = v_current_month
    AND status IN ('published', 'scheduled');
    
    -- Get this week usage
    SELECT COALESCE(COUNT(*), 0)
    INTO v_this_week
    FROM public.autopostvn_post_usage
    WHERE user_id = p_user_id
    AND DATE_TRUNC('week', created_at) = DATE_TRUNC('week', NOW())
    AND status IN ('published', 'scheduled');
    
    -- Get today usage
    SELECT COALESCE(COUNT(*), 0)
    INTO v_today
    FROM public.autopostvn_post_usage
    WHERE user_id = p_user_id
    AND DATE_TRUNC('day', created_at) = DATE_TRUNC('day', NOW())
    AND status IN ('published', 'scheduled');
    
    -- Get limits
    SELECT monthly_limit, daily_limit
    INTO v_monthly_limit, v_daily_limit
    FROM public.autopostvn_post_rate_limits
    WHERE user_role = p_user_role;
    
    -- Default to free if not found
    IF v_monthly_limit IS NULL THEN
        SELECT monthly_limit, daily_limit
        INTO v_monthly_limit, v_daily_limit
        FROM public.autopostvn_post_rate_limits
        WHERE user_role = 'free';
    END IF;
    
    -- Build result
    v_result := json_build_object(
        'monthly_usage', v_monthly_usage,
        'monthly_limit', v_monthly_limit,
        'daily_usage', v_today,
        'daily_limit', v_daily_limit,
        'weekly_usage', v_this_week,
        'user_role', p_user_role,
        'allowed', CASE 
            WHEN v_monthly_limit = -1 AND v_daily_limit = -1 THEN true
            WHEN v_monthly_limit = -1 THEN v_today < v_daily_limit
            WHEN v_daily_limit = -1 THEN v_monthly_usage < v_monthly_limit
            ELSE v_monthly_usage < v_monthly_limit AND v_today < v_daily_limit
        END
    );
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION public.get_user_post_usage(p_user_id uuid, p_user_role character varying) OWNER TO autopost_admin;

--
-- TOC entry 5331 (class 0 OID 0)
-- Dependencies: 303
-- Name: FUNCTION get_user_post_usage(p_user_id uuid, p_user_role character varying); Type: COMMENT; Schema: public; Owner: autopost_admin
--

COMMENT ON FUNCTION public.get_user_post_usage(p_user_id uuid, p_user_role character varying) IS 'Returns comprehensive post usage statistics for a user';


--
-- TOC entry 306 (class 1255 OID 41220)
-- Name: get_workspace_settings(uuid); Type: FUNCTION; Schema: public; Owner: autopost_admin
--

CREATE FUNCTION public.get_workspace_settings(workspace_uuid uuid) RETURNS jsonb
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT settings INTO result
  FROM autopostvn_workspaces
  WHERE id = workspace_uuid;
  
  -- Return settings or default if empty
  IF result IS NULL OR result = '{}'::jsonb THEN
    result := jsonb_build_object(
      'notifications', jsonb_build_object(
        'onSuccess', true,
        'onFailure', true,
        'onTokenExpiry', true
      ),
      'scheduling', jsonb_build_object(
        'timezone', 'Asia/Ho_Chi_Minh',
        'goldenHours', jsonb_build_array('09:00', '12:30', '20:00'),
        'rateLimit', 10
      ),
      'advanced', jsonb_build_object(
        'autoDeleteOldPosts', false,
        'autoDeleteDays', 30,
        'testMode', false
      )
    );
  END IF;
  
  RETURN result;
END;
$$;


ALTER FUNCTION public.get_workspace_settings(workspace_uuid uuid) OWNER TO autopost_admin;

--
-- TOC entry 5332 (class 0 OID 0)
-- Dependencies: 306
-- Name: FUNCTION get_workspace_settings(workspace_uuid uuid); Type: COMMENT; Schema: public; Owner: autopost_admin
--

COMMENT ON FUNCTION public.get_workspace_settings(workspace_uuid uuid) IS 'Get workspace settings with default fallback';


--
-- TOC entry 304 (class 1255 OID 41203)
-- Name: log_post_creation(uuid, uuid, character varying, character varying, text, integer, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: autopost_admin
--

CREATE FUNCTION public.log_post_creation(p_user_id uuid, p_post_id uuid, p_platform character varying, p_post_type character varying DEFAULT 'regular'::character varying, p_content_preview text DEFAULT NULL::text, p_media_count integer DEFAULT 0, p_scheduled_for timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_usage_id UUID;
BEGIN
    INSERT INTO public.autopostvn_post_usage (
        user_id,
        post_id,
        platform,
        post_type,
        content_preview,
        media_count,
        scheduled_for,
        status
    ) VALUES (
        p_user_id,
        p_post_id,
        p_platform,
        p_post_type,
        p_content_preview,
        p_media_count,
        p_scheduled_for,
        CASE WHEN p_scheduled_for IS NOT NULL THEN 'scheduled' ELSE 'published' END
    ) RETURNING id INTO v_usage_id;
    
    RETURN v_usage_id;
END;
$$;


ALTER FUNCTION public.log_post_creation(p_user_id uuid, p_post_id uuid, p_platform character varying, p_post_type character varying, p_content_preview text, p_media_count integer, p_scheduled_for timestamp with time zone) OWNER TO autopost_admin;

--
-- TOC entry 5333 (class 0 OID 0)
-- Dependencies: 304
-- Name: FUNCTION log_post_creation(p_user_id uuid, p_post_id uuid, p_platform character varying, p_post_type character varying, p_content_preview text, p_media_count integer, p_scheduled_for timestamp with time zone); Type: COMMENT; Schema: public; Owner: autopost_admin
--

COMMENT ON FUNCTION public.log_post_creation(p_user_id uuid, p_post_id uuid, p_platform character varying, p_post_type character varying, p_content_preview text, p_media_count integer, p_scheduled_for timestamp with time zone) IS 'Logs a new post creation for usage tracking';


--
-- TOC entry 287 (class 1255 OID 41058)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: autopost_admin
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO autopost_admin;

--
-- TOC entry 307 (class 1255 OID 41221)
-- Name: update_workspace_settings(uuid, jsonb); Type: FUNCTION; Schema: public; Owner: autopost_admin
--

CREATE FUNCTION public.update_workspace_settings(workspace_uuid uuid, new_settings jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
  result jsonb;
BEGIN
  UPDATE autopostvn_workspaces
  SET 
    settings = new_settings,
    updated_at = now()
  WHERE id = workspace_uuid
  RETURNING settings INTO result;
  
  RETURN result;
END;
$$;


ALTER FUNCTION public.update_workspace_settings(workspace_uuid uuid, new_settings jsonb) OWNER TO autopost_admin;

--
-- TOC entry 5334 (class 0 OID 0)
-- Dependencies: 307
-- Name: FUNCTION update_workspace_settings(workspace_uuid uuid, new_settings jsonb); Type: COMMENT; Schema: public; Owner: autopost_admin
--

COMMENT ON FUNCTION public.update_workspace_settings(workspace_uuid uuid, new_settings jsonb) IS 'Update workspace settings and return the new value';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 226 (class 1259 OID 40985)
-- Name: autopostvn_account_performance; Type: TABLE; Schema: public; Owner: autopost_admin
--

CREATE TABLE public.autopostvn_account_performance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    social_account_id uuid,
    date date NOT NULL,
    followers_count integer DEFAULT 0,
    posts_count integer DEFAULT 0,
    engagement_rate numeric(5,2) DEFAULT 0.00,
    reach integer DEFAULT 0,
    impressions integer DEFAULT 0,
    metrics jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.autopostvn_account_performance OWNER TO autopost_admin;

--
-- TOC entry 233 (class 1259 OID 41163)
-- Name: autopostvn_ai_rate_limits; Type: TABLE; Schema: public; Owner: autopost_admin
--

CREATE TABLE public.autopostvn_ai_rate_limits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_role character varying(20) NOT NULL,
    daily_limit integer NOT NULL,
    monthly_limit integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.autopostvn_ai_rate_limits OWNER TO autopost_admin;

--
-- TOC entry 239 (class 1259 OID 41307)
-- Name: autopostvn_ai_usage; Type: TABLE; Schema: public; Owner: autopost_admin
--

CREATE TABLE public.autopostvn_ai_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    request_type character varying(50) NOT NULL,
    request_date date DEFAULT CURRENT_DATE NOT NULL,
    request_timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    tokens_used integer DEFAULT 0,
    success boolean DEFAULT true,
    error_message text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.autopostvn_ai_usage OWNER TO autopost_admin;

--
-- TOC entry 224 (class 1259 OID 40936)
-- Name: autopostvn_analytics_events; Type: TABLE; Schema: public; Owner: autopost_admin
--

CREATE TABLE public.autopostvn_analytics_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    post_id uuid,
    social_account_id uuid,
    event_type text NOT NULL,
    event_data jsonb NOT NULL,
    user_agent text,
    ip_address inet,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.autopostvn_analytics_events OWNER TO autopost_admin;

--
-- TOC entry 227 (class 1259 OID 41007)
-- Name: autopostvn_api_keys; Type: TABLE; Schema: public; Owner: autopost_admin
--

CREATE TABLE public.autopostvn_api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    name text NOT NULL,
    key_hash text NOT NULL,
    permissions text[] DEFAULT '{}'::text[],
    last_used_at timestamp with time zone,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.autopostvn_api_keys OWNER TO autopost_admin;

--
-- TOC entry 225 (class 1259 OID 40960)
-- Name: autopostvn_error_logs; Type: TABLE; Schema: public; Owner: autopost_admin
--

CREATE TABLE public.autopostvn_error_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    error_type text NOT NULL,
    error_message text NOT NULL,
    error_stack text,
    context jsonb DEFAULT '{}'::jsonb,
    post_schedule_id uuid,
    social_account_id uuid,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.autopostvn_error_logs OWNER TO autopost_admin;

--
-- TOC entry 235 (class 1259 OID 41222)
-- Name: autopostvn_media; Type: TABLE; Schema: public; Owner: autopost_admin
--

CREATE TABLE public.autopostvn_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    workspace_id uuid,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_type text NOT NULL,
    file_size bigint NOT NULL,
    media_type character varying(20) DEFAULT 'image'::character varying,
    bucket text DEFAULT 'media'::text,
    public_url text NOT NULL,
    status character varying(20) DEFAULT 'uploaded'::character varying,
    published_at timestamp without time zone,
    archived_at timestamp without time zone,
    deleted_at timestamp without time zone,
    engagement_score integer DEFAULT 0,
    platform_urls jsonb DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    tags text[] DEFAULT '{}'::text[],
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT autopostvn_media_media_type_check CHECK (((media_type)::text = ANY ((ARRAY['image'::character varying, 'video'::character varying])::text[]))),
    CONSTRAINT autopostvn_media_status_check CHECK (((status)::text = ANY ((ARRAY['uploaded'::character varying, 'processing'::character varying, 'published'::character varying, 'archived'::character varying, 'deleted'::character varying])::text[])))
);


ALTER TABLE public.autopostvn_media OWNER TO autopost_admin;

--
-- TOC entry 5335 (class 0 OID 0)
-- Dependencies: 235
-- Name: TABLE autopostvn_media; Type: COMMENT; Schema: public; Owner: autopost_admin
--

COMMENT ON TABLE public.autopostvn_media IS 'Media library with lifecycle management for uploaded images and videos';


--
-- TOC entry 5336 (class 0 OID 0)
-- Dependencies: 235
-- Name: COLUMN autopostvn_media.status; Type: COMMENT; Schema: public; Owner: autopost_admin
--

COMMENT ON COLUMN public.autopostvn_media.status IS 'Media lifecycle status: uploaded, processing, published, archived, deleted';


--
-- TOC entry 5337 (class 0 OID 0)
-- Dependencies: 235
-- Name: COLUMN autopostvn_media.engagement_score; Type: COMMENT; Schema: public; Owner: autopost_admin
--

COMMENT ON COLUMN public.autopostvn_media.engagement_score IS 'Combined engagement score from all platforms';


--
-- TOC entry 5338 (class 0 OID 0)
-- Dependencies: 235
-- Name: COLUMN autopostvn_media.platform_urls; Type: COMMENT; Schema: public; Owner: autopost_admin
--

COMMENT ON COLUMN public.autopostvn_media.platform_urls IS 'JSON object with platform URLs: {"facebook": "url", "tiktok": "url"}';


--
-- TOC entry 5339 (class 0 OID 0)
-- Dependencies: 235
-- Name: COLUMN autopostvn_media.metadata; Type: COMMENT; Schema: public; Owner: autopost_admin
--

COMMENT ON COLUMN public.autopostvn_media.metadata IS 'Additional metadata: duration, dimensions, size, etc';


--
-- TOC entry 5340 (class 0 OID 0)
-- Dependencies: 235
-- Name: COLUMN autopostvn_media.tags; Type: COMMENT; Schema: public; Owner: autopost_admin
--

COMMENT ON COLUMN public.autopostvn_media.tags IS 'User-defined tags for organization';


--
-- TOC entry 232 (class 1259 OID 41114)
-- Name: autopostvn_oauth_sessions; Type: TABLE; Schema: public; Owner: autopost_admin
--

CREATE TABLE public.autopostvn_oauth_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_email character varying(255) NOT NULL,
    provider character varying(50) NOT NULL,
    state_token character varying(255) NOT NULL,
    redirect_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:30:00'::interval) NOT NULL
);


ALTER TABLE public.autopostvn_oauth_sessions OWNER TO autopost_admin;

--
-- TOC entry 5341 (class 0 OID 0)
-- Dependencies: 232
-- Name: TABLE autopostvn_oauth_sessions; Type: COMMENT; Schema: public; Owner: autopost_admin
--

COMMENT ON TABLE public.autopostvn_oauth_sessions IS 'Temporary sessions for OAuth flow state management';


--
-- TOC entry 223 (class 1259 OID 40921)
-- Name: autopostvn_post_analytics; Type: TABLE; Schema: public; Owner: autopost_admin
--

CREATE TABLE public.autopostvn_post_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid,
    provider text NOT NULL,
    metrics jsonb NOT NULL,
    collected_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.autopostvn_post_analytics OWNER TO autopost_admin;

--
-- TOC entry 234 (class 1259 OID 41189)
-- Name: autopostvn_post_rate_limits; Type: TABLE; Schema: public; Owner: autopost_admin
--

CREATE TABLE public.autopostvn_post_rate_limits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_role character varying(50) NOT NULL,
    monthly_limit integer NOT NULL,
    daily_limit integer DEFAULT '-1'::integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.autopostvn_post_rate_limits OWNER TO autopost_admin;

--
-- TOC entry 5342 (class 0 OID 0)
-- Dependencies: 234
-- Name: TABLE autopostvn_post_rate_limits; Type: COMMENT; Schema: public; Owner: autopost_admin
--

COMMENT ON TABLE public.autopostvn_post_rate_limits IS 'Defines post limits per user role (free, professional, enterprise) with autopostvn prefix';


--
-- TOC entry 222 (class 1259 OID 40897)
-- Name: autopostvn_post_schedules; Type: TABLE; Schema: public; Owner: autopost_admin
--

CREATE TABLE public.autopostvn_post_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid,
    social_account_id uuid,
    scheduled_at timestamp with time zone NOT NULL,
    status text DEFAULT 'pending'::text,
    external_post_id text,
    error_message text,
    retry_count integer DEFAULT 0,
    engagement_data jsonb DEFAULT '{}'::jsonb,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT autopostvn_post_schedules_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'publishing'::text, 'published'::text, 'failed'::text, 'cancelled'::text])))
);


ALTER TABLE public.autopostvn_post_schedules OWNER TO autopost_admin;

--
-- TOC entry 240 (class 1259 OID 41327)
-- Name: autopostvn_post_usage; Type: TABLE; Schema: public; Owner: autopost_admin
--

CREATE TABLE public.autopostvn_post_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    post_id uuid,
    post_type character varying(50) DEFAULT 'regular'::character varying,
    platform character varying(50) NOT NULL,
    content_preview text,
    media_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    scheduled_for timestamp with time zone,
    published_at timestamp with time zone,
    status character varying(50) DEFAULT 'draft'::character varying,
    metadata jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.autopostvn_post_usage OWNER TO autopost_admin;

--
-- TOC entry 221 (class 1259 OID 40876)
-- Name: autopostvn_posts; Type: TABLE; Schema: public; Owner: autopost_admin
--

CREATE TABLE public.autopostvn_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    user_id uuid NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    media_urls text[] DEFAULT '{}'::text[],
    providers text[] DEFAULT '{}'::text[],
    status text DEFAULT 'draft'::text,
    scheduled_at timestamp with time zone,
    published_at timestamp with time zone,
    engagement_data jsonb DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    account_id uuid,
    media_type character varying(20) DEFAULT 'none'::character varying,
    CONSTRAINT autopostvn_posts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'publishing'::text, 'published'::text, 'failed'::text, 'archived'::text]))),
    CONSTRAINT media_type_check CHECK (((media_type)::text = ANY ((ARRAY['image'::character varying, 'video'::character varying, 'album'::character varying, 'none'::character varying])::text[])))
);


ALTER TABLE public.autopostvn_posts OWNER TO autopost_admin;

--
-- TOC entry 5343 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN autopostvn_posts.media_type; Type: COMMENT; Schema: public; Owner: autopost_admin
--

COMMENT ON COLUMN public.autopostvn_posts.media_type IS 'Type of media: image, video, album, or none for text-only posts';


--
-- TOC entry 220 (class 1259 OID 40854)
-- Name: autopostvn_social_accounts; Type: TABLE; Schema: public; Owner: autopost_admin
--

CREATE TABLE public.autopostvn_social_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    provider text NOT NULL,
    provider_id text NOT NULL,
    name text NOT NULL,
    avatar_url text,
    username text,
    token_encrypted text NOT NULL,
    refresh_token_encrypted text,
    scopes text[] DEFAULT '{}'::text[],
    expires_at timestamp with time zone,
    status text DEFAULT 'connected'::text,
    last_sync_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    platform_name text,
    CONSTRAINT autopostvn_social_accounts_provider_check CHECK ((provider = ANY (ARRAY['facebook'::text, 'facebook_page'::text, 'instagram'::text, 'zalo'::text, 'buffer'::text]))),
    CONSTRAINT autopostvn_social_accounts_status_check CHECK ((status = ANY (ARRAY['connected'::text, 'expired'::text, 'error'::text, 'disconnected'::text])))
);


ALTER TABLE public.autopostvn_social_accounts OWNER TO autopost_admin;

--
-- TOC entry 238 (class 1259 OID 41280)
-- Name: autopostvn_system_activity_logs; Type: TABLE; Schema: public; Owner: autopost_admin
--

CREATE TABLE public.autopostvn_system_activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    workspace_id uuid,
    action_type text NOT NULL,
    action_category text NOT NULL,
    description text NOT NULL,
    target_resource_type text,
    target_resource_id uuid,
    previous_data jsonb DEFAULT '{}'::jsonb,
    new_data jsonb DEFAULT '{}'::jsonb,
    ip_address inet,
    user_agent text,
    request_id text,
    session_id text,
    status text DEFAULT 'success'::text,
    error_message text,
    duration_ms integer,
    additional_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT autopostvn_system_activity_logs_action_category_check CHECK ((action_category = ANY (ARRAY['auth'::text, 'post'::text, 'account'::text, 'workspace'::text, 'admin'::text, 'api'::text]))),
    CONSTRAINT autopostvn_system_activity_logs_status_check CHECK ((status = ANY (ARRAY['success'::text, 'failed'::text, 'warning'::text])))
);


ALTER TABLE public.autopostvn_system_activity_logs OWNER TO autopost_admin;

--
-- TOC entry 230 (class 1259 OID 41078)
-- Name: autopostvn_user_social_accounts; Type: TABLE; Schema: public; Owner: autopost_admin
--

CREATE TABLE public.autopostvn_user_social_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_email character varying(255) NOT NULL,
    workspace_id uuid NOT NULL,
    provider character varying(50) NOT NULL,
    account_name character varying(255) NOT NULL,
    provider_account_id character varying(255) NOT NULL,
    access_token text NOT NULL,
    refresh_token text,
    token_expires_at timestamp with time zone,
    account_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    status character varying(50) DEFAULT 'connected'::character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT autopostvn_user_social_accounts_provider_check CHECK (((provider)::text = ANY ((ARRAY['facebook'::character varying, 'instagram'::character varying, 'zalo'::character varying])::text[]))),
    CONSTRAINT autopostvn_user_social_accounts_status_check CHECK (((status)::text = ANY ((ARRAY['connected'::character varying, 'expired'::character varying, 'error'::character varying])::text[])))
);


ALTER TABLE public.autopostvn_user_social_accounts OWNER TO autopost_admin;

--
-- TOC entry 5344 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE autopostvn_user_social_accounts; Type: COMMENT; Schema: public; Owner: autopost_admin
--

COMMENT ON TABLE public.autopostvn_user_social_accounts IS 'OAuth-connected social media accounts per user';


--
-- TOC entry 229 (class 1259 OID 41064)
-- Name: autopostvn_user_workspaces; Type: TABLE; Schema: public; Owner: autopost_admin
--

CREATE TABLE public.autopostvn_user_workspaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_email character varying(255) NOT NULL,
    workspace_name character varying(255) NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.autopostvn_user_workspaces OWNER TO autopost_admin;

--
-- TOC entry 5345 (class 0 OID 0)
-- Dependencies: 229
-- Name: TABLE autopostvn_user_workspaces; Type: COMMENT; Schema: public; Owner: autopost_admin
--

COMMENT ON TABLE public.autopostvn_user_workspaces IS 'DEPRECATED: Use autopostvn_workspaces.user_id instead. This table will be removed in future migration.';


--
-- TOC entry 231 (class 1259 OID 41109)
-- Name: autopostvn_user_posts; Type: VIEW; Schema: public; Owner: autopost_admin
--

CREATE VIEW public.autopostvn_user_posts AS
 SELECT p.id,
    p.workspace_id,
    p.user_id,
    p.title,
    p.content,
    p.media_urls,
    p.providers,
    p.status,
    p.scheduled_at,
    p.published_at,
    p.engagement_data,
    p.metadata,
    p.created_at,
    p.updated_at,
    p.account_id,
    usa.user_email,
    usa.provider,
    usa.account_name,
    uw.workspace_name
   FROM ((public.autopostvn_posts p
     JOIN public.autopostvn_user_social_accounts usa ON ((p.account_id = usa.id)))
     JOIN public.autopostvn_user_workspaces uw ON ((usa.workspace_id = uw.id)));


ALTER VIEW public.autopostvn_user_posts OWNER TO autopost_admin;

--
-- TOC entry 5346 (class 0 OID 0)
-- Dependencies: 231
-- Name: VIEW autopostvn_user_posts; Type: COMMENT; Schema: public; Owner: autopost_admin
--

COMMENT ON VIEW public.autopostvn_user_posts IS 'User posts with account information for easy querying';


--
-- TOC entry 237 (class 1259 OID 41269)
-- Name: autopostvn_user_profiles; Type: TABLE; Schema: public; Owner: autopost_admin
--

CREATE TABLE public.autopostvn_user_profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text NOT NULL,
    avatar_url text,
    phone text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.autopostvn_user_profiles OWNER TO autopost_admin;

--
-- TOC entry 236 (class 1259 OID 41251)
-- Name: autopostvn_users; Type: TABLE; Schema: public; Owner: autopost_admin
--

CREATE TABLE public.autopostvn_users (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    user_role character varying(20) DEFAULT 'free'::character varying NOT NULL,
    is_active boolean DEFAULT true,
    subscription_expires_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    phone character varying(20),
    password_hash text,
    email_verified boolean DEFAULT false,
    email_verified_at timestamp with time zone,
    CONSTRAINT autopostvn_users_user_role_check CHECK (((user_role)::text = ANY (ARRAY[('free'::character varying)::text, ('professional'::character varying)::text, ('enterprise'::character varying)::text])))
);


ALTER TABLE public.autopostvn_users OWNER TO autopost_admin;

--
-- TOC entry 228 (class 1259 OID 41025)
-- Name: autopostvn_webhooks; Type: TABLE; Schema: public; Owner: autopost_admin
--

CREATE TABLE public.autopostvn_webhooks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    url text NOT NULL,
    events text[] NOT NULL,
    secret text NOT NULL,
    is_active boolean DEFAULT true,
    last_triggered_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.autopostvn_webhooks OWNER TO autopost_admin;

--
-- TOC entry 219 (class 1259 OID 40841)
-- Name: autopostvn_workspaces; Type: TABLE; Schema: public; Owner: autopost_admin
--

CREATE TABLE public.autopostvn_workspaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text,
    description text,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid
);


ALTER TABLE public.autopostvn_workspaces OWNER TO autopost_admin;

--
-- TOC entry 5347 (class 0 OID 0)
-- Dependencies: 219
-- Name: COLUMN autopostvn_workspaces.settings; Type: COMMENT; Schema: public; Owner: autopost_admin
--

COMMENT ON COLUMN public.autopostvn_workspaces.settings IS 'Workspace settings including notifications, scheduling preferences, and advanced options';


--
-- TOC entry 5348 (class 0 OID 0)
-- Dependencies: 219
-- Name: COLUMN autopostvn_workspaces.user_id; Type: COMMENT; Schema: public; Owner: autopost_admin
--

COMMENT ON COLUMN public.autopostvn_workspaces.user_id IS 'Owner of this workspace. NULL for system/demo workspaces only.';


--
-- TOC entry 5309 (class 0 OID 40985)
-- Dependencies: 226
-- Data for Name: autopostvn_account_performance; Type: TABLE DATA; Schema: public; Owner: autopost_admin
--

COPY public.autopostvn_account_performance (id, social_account_id, date, followers_count, posts_count, engagement_rate, reach, impressions, metrics, created_at) FROM stdin;
\.


--
-- TOC entry 5315 (class 0 OID 41163)
-- Dependencies: 233
-- Data for Name: autopostvn_ai_rate_limits; Type: TABLE DATA; Schema: public; Owner: autopost_admin
--

COPY public.autopostvn_ai_rate_limits (id, user_role, daily_limit, monthly_limit, created_at, updated_at) FROM stdin;
8dc0429f-257c-4e80-ba1f-363e843e180d	enterprise	-1	-1	2025-11-09 14:29:10.844222+07	2025-11-09 14:29:10.844222+07
d046f030-d25b-4c82-b6dd-4cd5ccb0c818	professional	50	1000	2025-11-09 14:29:10.844222+07	2025-11-09 14:29:22.286503+07
80d4f6cc-f819-4719-8fd3-9f31c2a376f2	free	5	10	2025-11-09 14:29:10.844222+07	2025-11-09 20:08:57.940232+07
\.


--
-- TOC entry 5321 (class 0 OID 41307)
-- Dependencies: 239
-- Data for Name: autopostvn_ai_usage; Type: TABLE DATA; Schema: public; Owner: autopost_admin
--

COPY public.autopostvn_ai_usage (id, user_id, request_type, request_date, request_timestamp, tokens_used, success, error_message, created_at, updated_at) FROM stdin;
b46787c0-99e1-495a-b84d-928084a703ae	6b02ec4d-e0de-4834-a48f-84999e696891	caption	2025-11-10	2025-11-10 22:05:38.923039+07	0	t	\N	2025-11-10 22:05:38.923039+07	2025-11-10 22:05:38.923039+07
15dd1da7-74d0-4e69-ba56-d107418e25c5	6b02ec4d-e0de-4834-a48f-84999e696891	caption	2025-11-11	2025-11-11 00:58:21.854346+07	0	t	\N	2025-11-11 00:58:21.854346+07	2025-11-11 00:58:21.854346+07
b0858f24-bb70-4d89-b377-49e828505646	6b02ec4d-e0de-4834-a48f-84999e696891	caption	2025-11-12	2025-11-12 05:58:45.758014+07	0	f	Không thể tạo caption. Vui lòng thử lại.	2025-11-12 05:58:45.758014+07	2025-11-12 05:58:45.758014+07
f5303b43-42f4-4e76-b150-e22f5dff2acb	3005f34d-5584-4e7c-93eb-7090240caa8f	caption	2025-11-12	2025-11-12 08:44:31.563519+07	0	t	\N	2025-11-12 08:44:31.563519+07	2025-11-12 08:44:31.563519+07
6bc68465-f1d3-4062-a401-b77952e2030a	3005f34d-5584-4e7c-93eb-7090240caa8f	content_plan	2025-11-12	2025-11-12 16:38:08.28599+07	0	f	Không thể tạo kế hoạch nội dung. Vui lòng thử lại.	2025-11-12 16:38:08.28599+07	2025-11-12 16:38:08.28599+07
229d552d-adb1-493c-a54f-dfbda211b2b9	3005f34d-5584-4e7c-93eb-7090240caa8f	caption	2025-11-12	2025-11-12 16:41:43.627897+07	0	f	Không thể tạo caption. Vui lòng thử lại.	2025-11-12 16:41:43.627897+07	2025-11-12 16:41:43.627897+07
caaa1448-648d-4a1f-8fb1-486512de42a8	3005f34d-5584-4e7c-93eb-7090240caa8f	caption	2025-11-12	2025-11-12 17:59:29.249224+07	0	f	Không thể tạo caption. Vui lòng thử lại.	2025-11-12 17:59:29.249224+07	2025-11-12 17:59:29.249224+07
\.


--
-- TOC entry 5307 (class 0 OID 40936)
-- Dependencies: 224
-- Data for Name: autopostvn_analytics_events; Type: TABLE DATA; Schema: public; Owner: autopost_admin
--

COPY public.autopostvn_analytics_events (id, workspace_id, post_id, social_account_id, event_type, event_data, user_agent, ip_address, created_at) FROM stdin;
\.


--
-- TOC entry 5310 (class 0 OID 41007)
-- Dependencies: 227
-- Data for Name: autopostvn_api_keys; Type: TABLE DATA; Schema: public; Owner: autopost_admin
--

COPY public.autopostvn_api_keys (id, workspace_id, name, key_hash, permissions, last_used_at, expires_at, is_active, created_at) FROM stdin;
\.


--
-- TOC entry 5308 (class 0 OID 40960)
-- Dependencies: 225
-- Data for Name: autopostvn_error_logs; Type: TABLE DATA; Schema: public; Owner: autopost_admin
--

COPY public.autopostvn_error_logs (id, workspace_id, error_type, error_message, error_stack, context, post_schedule_id, social_account_id, resolved_at, created_at) FROM stdin;
\.


--
-- TOC entry 5317 (class 0 OID 41222)
-- Dependencies: 235
-- Data for Name: autopostvn_media; Type: TABLE DATA; Schema: public; Owner: autopost_admin
--

COPY public.autopostvn_media (id, user_id, workspace_id, file_name, file_path, file_type, file_size, media_type, bucket, public_url, status, published_at, archived_at, deleted_at, engagement_score, platform_urls, metadata, tags, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5314 (class 0 OID 41114)
-- Dependencies: 232
-- Data for Name: autopostvn_oauth_sessions; Type: TABLE DATA; Schema: public; Owner: autopost_admin
--

COPY public.autopostvn_oauth_sessions (id, user_email, provider, state_token, redirect_uri, created_at, expires_at) FROM stdin;
\.


--
-- TOC entry 5306 (class 0 OID 40921)
-- Dependencies: 223
-- Data for Name: autopostvn_post_analytics; Type: TABLE DATA; Schema: public; Owner: autopost_admin
--

COPY public.autopostvn_post_analytics (id, post_id, provider, metrics, collected_at, created_at) FROM stdin;
\.


--
-- TOC entry 5316 (class 0 OID 41189)
-- Dependencies: 234
-- Data for Name: autopostvn_post_rate_limits; Type: TABLE DATA; Schema: public; Owner: autopost_admin
--

COPY public.autopostvn_post_rate_limits (id, user_role, monthly_limit, daily_limit, created_at, updated_at) FROM stdin;
5f5d3aed-ac31-410a-8965-2237e38312c3	free	10	1	2025-11-09 14:29:13.844184+07	2025-11-09 14:29:13.844184+07
5705e6fc-6a69-4463-96c7-a86c6f8d56ef	professional	100	10	2025-11-09 14:29:13.844184+07	2025-11-09 14:29:13.844184+07
264c96ed-7c40-4ec6-8927-7ca1ce99f197	enterprise	-1	-1	2025-11-09 14:29:13.844184+07	2025-11-09 14:29:13.844184+07
\.


--
-- TOC entry 5305 (class 0 OID 40897)
-- Dependencies: 222
-- Data for Name: autopostvn_post_schedules; Type: TABLE DATA; Schema: public; Owner: autopost_admin
--

COPY public.autopostvn_post_schedules (id, post_id, social_account_id, scheduled_at, status, external_post_id, error_message, retry_count, engagement_data, published_at, created_at, updated_at) FROM stdin;
efd20a44-607a-4b7c-b8cf-d0e486846f45	896d75f0-f8c7-4977-915a-8bb4101d0cc4	f11a4189-ae2f-498b-a8fa-1e9b06d004a2	2025-11-12 07:50:00+07	published	849430298247182_122111666667059241	Published successfully	0	{}	2025-11-12 07:48:47.353729+07	2025-11-12 07:48:31.352563+07	2025-11-12 07:48:47.353729+07
4a0d4a1c-31d5-4a69-b3c7-fa15d53310ae	896d75f0-f8c7-4977-915a-8bb4101d0cc4	f7aa374e-b8cb-4e4f-981c-f591eae0f50d	2025-11-12 07:50:00+07	published	758424104026962_122114098431010117	Published successfully	0	{}	2025-11-12 07:48:49.57045+07	2025-11-12 07:48:31.355902+07	2025-11-12 07:48:49.57045+07
946b38d4-06ef-4599-8240-ab5797b0dc34	896d75f0-f8c7-4977-915a-8bb4101d0cc4	77ffede9-0b55-409c-9ecc-1d4976173a46	2025-11-12 07:50:00+07	published	2434854103192852_1279940207493396	Published successfully	0	{}	2025-11-12 07:48:52.565697+07	2025-11-12 07:48:31.357861+07	2025-11-12 07:48:52.565697+07
6448a46e-1784-4596-b8a1-237b519ad908	896d75f0-f8c7-4977-915a-8bb4101d0cc4	9cde35ff-acf5-4bcd-8afd-864020df698b	2025-11-12 07:50:00+07	published	929891000491991_802776155917264	Published successfully	0	{}	2025-11-12 07:48:54.813093+07	2025-11-12 07:48:31.360304+07	2025-11-12 07:48:54.813093+07
bc8cddb0-4842-4b9c-be35-bf9f99fdc6e5	d4af00fd-87a1-48a2-bdb9-3233acf53335	4b191ac9-a64c-4241-86f7-f0aff480d1bc	2025-11-09 21:15:02.296+07	failed	\N	System error: supabaseUrl is required.	0	{}	\N	2025-11-09 21:13:02.303124+07	2025-11-10 21:58:41.818719+07
e093f35a-7d48-499f-9347-9eeec38744d6	d4af00fd-87a1-48a2-bdb9-3233acf53335	f11a4189-ae2f-498b-a8fa-1e9b06d004a2	2025-11-09 21:15:02.296+07	failed	\N	System error: supabaseUrl is required.	0	{}	\N	2025-11-09 21:13:02.307135+07	2025-11-10 21:58:41.827444+07
c08e087a-eff6-4b99-b02e-5bce6f7d6c70	7885b2cb-36c5-41a8-b15b-2b006f063aef	beeb5cce-906b-4f5d-93cc-a300c39b9482	2025-11-12 08:23:00+07	published	849430298247182_122111683071059241	Published successfully	0	{}	2025-11-12 08:23:12.786355+07	2025-11-12 08:21:24.593199+07	2025-11-12 08:23:12.786355+07
f801d201-d5d1-4754-8a37-67d471e0532d	7885b2cb-36c5-41a8-b15b-2b006f063aef	9a8f8308-7981-4f86-b560-f18cd44c6e4f	2025-11-12 08:23:00+07	published	758424104026962_122114100357010117	Published successfully	0	{}	2025-11-12 08:23:14.937666+07	2025-11-12 08:21:24.598229+07	2025-11-12 08:23:14.937666+07
ed2d1b2f-016a-424a-8b6f-e37bfc390e74	7885b2cb-36c5-41a8-b15b-2b006f063aef	84ed9410-b4f7-454b-81ba-a6d576472bb2	2025-11-12 08:23:00+07	published	2434854103192852_1279958244158259	Published successfully	0	{}	2025-11-12 08:23:16.637661+07	2025-11-12 08:21:24.599867+07	2025-11-12 08:23:16.637661+07
4249b2b5-83b6-429b-bfbe-bab9775bb08c	7885b2cb-36c5-41a8-b15b-2b006f063aef	80b362a4-a32a-4a39-a8bd-41057de89c6c	2025-11-12 08:23:00+07	published	929891000491991_802793785915501	Published successfully	0	{}	2025-11-12 08:23:22.890363+07	2025-11-12 08:21:24.6014+07	2025-11-12 08:23:22.890363+07
85696605-ad35-4512-a334-f42be678447d	c65ee78d-4383-4721-ae9b-e1acd835524a	beeb5cce-906b-4f5d-93cc-a300c39b9482	2025-11-12 08:37:00+07	published	849430298247182_122111692305059241	Published successfully	0	{}	2025-11-12 08:36:06.782511+07	2025-11-12 08:35:06.623465+07	2025-11-12 08:36:06.782511+07
4920d507-fe53-418a-a01c-2096269e9a44	c65ee78d-4383-4721-ae9b-e1acd835524a	9a8f8308-7981-4f86-b560-f18cd44c6e4f	2025-11-12 08:37:00+07	published	758424104026962_122114101083010117	Published successfully	0	{}	2025-11-12 08:36:12.205747+07	2025-11-12 08:35:06.62889+07	2025-11-12 08:36:12.205747+07
a89ef5e6-c156-4729-8576-c33c1259070b	c65ee78d-4383-4721-ae9b-e1acd835524a	84ed9410-b4f7-454b-81ba-a6d576472bb2	2025-11-12 08:37:00+07	published	2434854103192852_1279964890824261	Published successfully	0	{}	2025-11-12 08:36:15.893008+07	2025-11-12 08:35:06.631197+07	2025-11-12 08:36:15.893008+07
2f00ae20-ada3-47a5-8646-bfe38707e3fc	c65ee78d-4383-4721-ae9b-e1acd835524a	80b362a4-a32a-4a39-a8bd-41057de89c6c	2025-11-12 08:37:00+07	published	929891000491991_802800669248146	Published successfully	0	{}	2025-11-12 08:36:20.460583+07	2025-11-12 08:35:06.633024+07	2025-11-12 08:36:20.460583+07
4cb69a9c-ae7a-461a-8d02-3b8b01ce29aa	fb310129-3d4d-4411-8841-70417abde989	e2472520-cfcc-4f64-9f16-0910c31fba14	2025-11-12 08:47:00+07	published	849430298247182_122111697297059241	Published successfully	0	{}	2025-11-12 08:47:34.391262+07	2025-11-12 08:45:06.784844+07	2025-11-12 08:47:34.391262+07
3adb198d-1edb-425c-b220-0b9afa91ee15	8eb9f32d-edc5-4bc2-84a1-abeeed4334cd	f11a4189-ae2f-498b-a8fa-1e9b06d004a2	2025-11-10 22:20:00+07	published	849430298247182_122111339223059241	Published successfully	0	{}	2025-11-10 22:19:10.398937+07	2025-11-10 22:18:12.733063+07	2025-11-10 22:19:10.398937+07
697d899f-e8e5-4e64-9a8a-826021b02cbd	8eb9f32d-edc5-4bc2-84a1-abeeed4334cd	f7aa374e-b8cb-4e4f-981c-f591eae0f50d	2025-11-10 22:20:00+07	published	758424104026962_122113873827010117	Published successfully	0	{}	2025-11-10 22:19:13.706463+07	2025-11-10 22:18:12.740322+07	2025-11-10 22:19:13.706463+07
a484dc65-b97e-4d6a-be93-0a1f44ce87be	8eb9f32d-edc5-4bc2-84a1-abeeed4334cd	77ffede9-0b55-409c-9ecc-1d4976173a46	2025-11-10 22:20:00+07	published	2434854103192852_1278747434279340	Published successfully	0	{}	2025-11-10 22:19:17.119702+07	2025-11-10 22:18:12.743835+07	2025-11-10 22:19:17.119702+07
633fbd12-1390-4247-8f96-1d5c59344241	8eb9f32d-edc5-4bc2-84a1-abeeed4334cd	9cde35ff-acf5-4bcd-8afd-864020df698b	2025-11-10 22:20:00+07	published	929891000491991_801658092695737	Published successfully	0	{}	2025-11-10 22:19:20.350409+07	2025-11-10 22:18:12.748483+07	2025-11-10 22:19:20.350409+07
91fe6046-cc3e-43d2-9bd2-0232d497fbc2	fb310129-3d4d-4411-8841-70417abde989	b6017ffc-7b87-4b26-b181-29cc17adc71d	2025-11-12 08:47:00+07	published	758424104026962_122114101575010117	Published successfully	0	{}	2025-11-12 08:47:36.686121+07	2025-11-12 08:45:06.789883+07	2025-11-12 08:47:36.686121+07
b3054571-3125-4e53-bbf6-baba2ab137da	fb310129-3d4d-4411-8841-70417abde989	521b7aa2-0ef0-4f1c-8f6a-054e4c569c54	2025-11-12 08:47:00+07	published	2434854103192852_1279972244156859	Published successfully	0	{}	2025-11-12 08:47:39.120275+07	2025-11-12 08:45:06.79307+07	2025-11-12 08:47:39.120275+07
066c1284-753c-488e-809b-2e21de06aa9e	fb310129-3d4d-4411-8841-70417abde989	63c7551a-d894-4bb5-933e-da28ee1dc16d	2025-11-12 08:47:00+07	published	929891000491991_802806762580870	Published successfully	0	{}	2025-11-12 08:47:43.01664+07	2025-11-12 08:45:06.795927+07	2025-11-12 08:47:43.01664+07
aa4d41da-a118-4a37-bfa4-77beb81fbda1	ae7ebbdd-2033-478d-a4eb-944443892728	f11a4189-ae2f-498b-a8fa-1e9b06d004a2	2025-11-12 06:05:00+07	published	849430298247182_122111657469059241	Published successfully	0	{}	2025-11-12 06:06:19.055292+07	2025-11-12 06:04:48.182142+07	2025-11-12 06:06:19.055292+07
c15ad94b-d9ad-4ca9-919e-b99a7a14de5a	ae7ebbdd-2033-478d-a4eb-944443892728	f7aa374e-b8cb-4e4f-981c-f591eae0f50d	2025-11-12 06:05:00+07	published	758424104026962_122114094393010117	Published successfully	0	{}	2025-11-12 06:06:23.645543+07	2025-11-12 06:04:48.189343+07	2025-11-12 06:06:23.645543+07
a0ab5ea2-72fb-46f0-b5ea-f9536020aad8	ae7ebbdd-2033-478d-a4eb-944443892728	77ffede9-0b55-409c-9ecc-1d4976173a46	2025-11-12 06:05:00+07	published	2434854103192852_1279890584165025	Published successfully	0	{}	2025-11-12 06:06:26.980357+07	2025-11-12 06:04:48.193968+07	2025-11-12 06:06:26.980357+07
ee4f81f5-1eaf-4da9-9274-8cc58998717d	ae7ebbdd-2033-478d-a4eb-944443892728	9cde35ff-acf5-4bcd-8afd-864020df698b	2025-11-12 06:05:00+07	published	929891000491991_802727509255462	Published successfully	0	{}	2025-11-12 06:06:30.381291+07	2025-11-12 06:04:48.196847+07	2025-11-12 06:06:30.381291+07
\.


--
-- TOC entry 5322 (class 0 OID 41327)
-- Dependencies: 240
-- Data for Name: autopostvn_post_usage; Type: TABLE DATA; Schema: public; Owner: autopost_admin
--

COPY public.autopostvn_post_usage (id, user_id, post_id, post_type, platform, content_preview, media_count, created_at, scheduled_for, published_at, status, metadata) FROM stdin;
\.


--
-- TOC entry 5304 (class 0 OID 40876)
-- Dependencies: 221
-- Data for Name: autopostvn_posts; Type: TABLE DATA; Schema: public; Owner: autopost_admin
--

COPY public.autopostvn_posts (id, workspace_id, user_id, title, content, media_urls, providers, status, scheduled_at, published_at, engagement_data, metadata, created_at, updated_at, account_id, media_type) FROM stdin;
eb040805-a538-4a7a-8b19-476a1ec851b3	486fdee4-7b40-453d-bb69-681b9f3f58f8	6b02ec4d-e0de-4834-a48f-84999e696891	🚀 CHÀO MỪNG ĐẾN VỚI THẾ GIỚI CỦA SMART LINK MANAGER! 🚀\n\nÊ, bạn có thấy mệt mỏi vì những đường link	🚀 CHÀO MỪNG ĐẾN VỚI THẾ GIỚI CỦA SMART LINK MANAGER! 🚀\n\nÊ, bạn có thấy mệt mỏi vì những đường link dài ngoằng, khó nhớ, trông lại còn "xấu xí" không? 😩 Hay bạn muốn biết đường link nào đang mang lại hiệu quả nhất cho chiến dịch của mình?\n\n👉 Đừng lo lắng nữa! Tớ xin giới thiệu: SMART LINK MANAGER - "siêu phẩm" giúp bạn rút gọn link và A/B testing cực đỉnh! 😎\n\n🤔 Bạn sẽ tự hỏi: "Smart Link Manager làm được những gì?"\n\n➡️ Để tớ bật mí cho bạn nghe nhé:\n\n✓ Rút gọn link cực nhanh, cực gọn, biến những đường link dài ngoằng thành những đường link ngắn gọn, dễ nhớ. 😉\n✓ A/B testing "thần thánh": So sánh hiệu quả của các đường link khác nhau, xem link nào "chiến" nhất để tối ưu hóa chiến dịch của bạn. 📈\n✓ Theo dõi số liệu chi tiết: Biết được ai click vào link, từ đâu đến, thời gian nào... Mọi thứ đều được hiển thị rõ ràng! 📊\n✓ Tùy chỉnh link theo ý thích: Bạn có thể tạo ra những đường link mang đậm dấu ấn cá nhân hoặc thương hiệu của mình. ✨\n✓ Giao diện thân thiện, dễ sử dụng: Dù bạn là "newbie" hay "pro", Smart Link Manager đều dễ dàng chinh phục. 🥰\n\n🎉 VÌ SAO BẠN NÊN DÙNG SMART LINK MANAGER? 🎉\n\n• Tiết kiệm thời gian và công sức: Không còn phải loay hoay với những đường link dài ngoằng nữa!\n• Tăng cường hiệu quả marketing: Tối ưu hóa chiến dịch của bạn bằng cách biết được điều gì thực sự hiệu quả.\n• Nâng tầm thương hiệu: Tạo ra những đường link chuyên nghiệp, ấn tượng.\n• Dễ dàng quản lý và theo dõi: Mọi thứ đều được hiển thị rõ ràng, giúp bạn đưa ra những quyết định sáng suốt.\n\n🔥 ĐẶC BIỆT:\n\nĐể chào mừng sự ra mắt của Smart Link Manager, chúng tớ có một ƯU ĐÃI CỰC HẤP DẪN dành cho bạn! 🎁\n\n➡️ Đăng ký ngay hôm nay để nhận được:\n\n✓ Gói dùng thử MIỄN PHÍ! 🤩\n✓ Ưu đãi giảm giá lên đến 30% cho các gói dịch vụ khác. 💰\n✓ Hỗ trợ tận tình từ đội ngũ chuyên nghiệp của chúng tớ. 🤗\n\n👉 Đừng bỏ lỡ cơ hội tuyệt vời này! Hãy click vào đường link dưới đây để tìm hiểu thêm và đăng ký ngay thôi! 👇\n\n[Chèn link vào đây]\n\n#SmartLinkManager #RutGonLink #ABTesting #MarketingOnline #DigitalMarketing #TieuDungThongMinh #CongCuHuuIch #UuDai #KhuyenMai #VietNam	{}	{facebook_page}	scheduled	\N	\N	{}	{"cta": "Mua ngay", "type": "social", "ratio": "1:1", "hashtags": "#SmartLinkManager #RutGonLink #ABTesting #MarketingOnline #DigitalMarketing #TieuDungThongMinh #CongCuHuuIch #UuDai #KhuyenMai #VietNam", "platform": "Facebook Page", "brandColor": "#0ea5e9"}	2025-11-09 18:54:40.297454+07	2025-11-09 19:29:56.403439+07	\N	none
d4af00fd-87a1-48a2-bdb9-3233acf53335	486fdee4-7b40-453d-bb69-681b9f3f58f8	6b02ec4d-e0de-4834-a48f-84999e696891	Test Auto Post 🚀	Đây là bài test tự động post từ scheduler. Bài này được lên lịch tự động! #autopost #test	{}	{facebook,facebook_page}	scheduled	2025-11-09 21:15:02.296+07	\N	{}	{}	2025-11-09 21:13:02.297625+07	2025-11-09 21:13:02.297625+07	\N	none
8eb9f32d-edc5-4bc2-84a1-abeeed4334cd	486fdee4-7b40-453d-bb69-681b9f3f58f8	6b02ec4d-e0de-4834-a48f-84999e696891	🔥 BÙNG NỔ CÙNG AUTOPOSTVN - CHÌA KHÓA VÀNG CHO MỌI CHIẾN DỊCH MARKETING! 🔥\n\nChào cả nhà yêu thích 	🔥 BÙNG NỔ CÙNG AUTOPOSTVN - CHÌA KHÓA VÀNG CHO MỌI CHIẾN DỊCH MARKETING! 🔥\n\nChào cả nhà yêu thích kinh doanh online! 👋\n\nBạn có mệt mỏi vì phải dành hàng giờ đồng hồ để đăng bài lên Facebook, Instagram và Zalo không? 😩 Cứ phải copy paste, rồi canh giờ đăng bài... tốn thời gian mà hiệu quả lại chưa cao?\n\nĐừng lo lắng nữa! 🤩 AutopostVN đã có mặt để giải quyết mọi vấn đề đó! 🎉\n\n➡️ AutopostVN là ứng dụng đăng bài TỰ ĐỘNG lên Facebook, Instagram và Zalo một cách NHANH CHÓNG và TIỆN LỢI! 🚀\n\nBạn sẽ nhận được gì khi sử dụng AutopostVN? 🤔\n\n✓ Tiết kiệm THỜI GIAN và CÔNG SỨC tối đa! 💪\n✓ Tăng TƯƠNG TÁC và tiếp cận khách hàng tiềm năng một cách hiệu quả! 📈\n✓ Quản lý nhiều tài khoản cùng lúc, dễ dàng và linh hoạt! 💯\n✓ Lên lịch đăng bài tự động, không lo bỏ lỡ bất kỳ thời điểm vàng nào! ⏰\n✓ Giao diện thân thiện, dễ sử dụng, phù hợp với mọi đối tượng! 😊\n\nAutopostVN không chỉ là một ứng dụng, mà còn là người bạn đồng hành đáng tin cậy trên con đường kinh doanh online của bạn! 🤝\n\n👉 Sẵn sàng bứt phá doanh thu cùng AutopostVN chưa?\n\n➡️ Tải ngay và trải nghiệm MIỄN PHÍ: autopostvn.cloud\n\nĐừng quên chia sẻ bài viết này đến bạn bè, người thân đang kinh doanh online để cùng nhau thành công nhé! 🥰\n\n#AutopostVN #Dangbaitudong #FacebookMarketing #InstagramMarketing #ZaloMarketing #Kinhdoanhonline #MarketingOnline #Tietkiemthoigian #Tangtuongtac #Buocphadoanhthu #Chiasemoi	{}	{facebook_page}	published	2025-11-10 22:20:00+07	2025-11-10 22:19:20.369355+07	{}	{"cta": "Mua ngay", "type": "social", "ratio": "1:1", "hashtags": "", "platform": "Facebook Page", "brandColor": "#0ea5e9"}	2025-11-10 22:18:12.716181+07	2025-11-10 22:19:20.369355+07	\N	none
ae7ebbdd-2033-478d-a4eb-944443892728	486fdee4-7b40-453d-bb69-681b9f3f58f8	6b02ec4d-e0de-4834-a48f-84999e696891	🔥 BÙNG NỔ CÙNG AUTOPOSTVN - CHÌA KHÓA VÀNG CHO MỌI CHIẾN DỊCH MARKETING! 🔥\n\nChào cả nhà yêu thích 	🔥 BÙNG NỔ CÙNG AUTOPOSTVN - CHÌA KHÓA VÀNG CHO MỌI CHIẾN DỊCH MARKETING! 🔥\n\nChào cả nhà yêu thích kinh doanh online! 👋\n\nBạn có mệt mỏi vì phải dành hàng giờ đồng hồ để đăng bài lên Facebook, Instagram và Zalo không? 😩 Cứ phải copy paste, rồi canh giờ đăng bài... tốn thời gian mà hiệu quả lại chưa cao?\n\nĐừng lo lắng nữa! 🤩 AutopostVN đã có mặt để giải quyết mọi vấn đề đó! 🎉\n\n➡️ AutopostVN là ứng dụng đăng bài TỰ ĐỘNG lên Facebook, Instagram và Zalo một cách NHANH CHÓNG và TIỆN LỢI! 🚀\n\nBạn sẽ nhận được gì khi sử dụng AutopostVN? 🤔\n\n✓ Tiết kiệm THỜI GIAN và CÔNG SỨC tối đa! 💪\n✓ Tăng TƯƠNG TÁC và tiếp cận khách hàng tiềm năng một cách hiệu quả! 📈\n✓ Quản lý nhiều tài khoản cùng lúc, dễ dàng và linh hoạt! 💯\n✓ Lên lịch đăng bài tự động, không lo bỏ lỡ bất kỳ thời điểm vàng nào! ⏰\n✓ Giao diện thân thiện, dễ sử dụng, phù hợp với mọi đối tượng! 😊\n\nAutopostVN không chỉ là một ứng dụng, mà còn là người bạn đồng hành đáng tin cậy trên con đường kinh doanh online của bạn! 🤝\n\n👉 Sẵn sàng bứt phá doanh thu cùng AutopostVN chưa?\n\n➡️ Tải ngay và trải nghiệm MIỄN PHÍ: autopostvn.cloud\n\nĐừng quên chia sẻ bài viết này đến bạn bè, người thân đang kinh doanh online để cùng nhau thành công nhé! 🥰\n\n	{http://localhost:3000/uploads/videos/6b02ec4d-e0de-4834-a48f-84999e696891/a2dd561c-f566-499d-b993-86b72b4c0304.mp4}	{facebook_page}	published	2025-11-12 06:05:00+07	2025-11-12 06:06:30.395767+07	{}	{"cta": "Mua ngay", "type": "social", "ratio": "1:1", "hashtags": "#AutopostVN #Dangbaitudong #FacebookMarketing #InstagramMarketing #ZaloMarketing #Kinhdoanhonline #MarketingOnline #Tietkiemthoigian #Tangtuongtac #Buocphadoanhthu #Chiasemoi", "platform": "Facebook Page", "brandColor": "#0ea5e9"}	2025-11-12 06:04:48.157874+07	2025-11-12 06:06:30.395767+07	\N	none
62d4e193-384e-4374-bfce-7268da7e51ea	486fdee4-7b40-453d-bb69-681b9f3f58f8	6b02ec4d-e0de-4834-a48f-84999e696891	🚀 BÙM! SLM.io.vn - NỀN TẢNG LINK RÚT GỌN NHANH NHẤT ĐÃ CÓ MẶT! 🚀\n\nChào mọi người ơi! 👋\n\nBạn có ba	🚀 BÙM! SLM.io.vn - NỀN TẢNG LINK RÚT GỌN NHANH NHẤT ĐÃ CÓ MẶT! 🚀\n\nChào mọi người ơi! 👋\n\nBạn có bao giờ cảm thấy "ức chế" vì những cái link dài ngoằng, khó nhớ, chia sẻ thì bất tiện chưa? 😫\n\nĐừng lo lắng nữa! Vì SLM.io.vn đã đến để "giải cứu" bạn khỏi tình trạng này! 😎\n\nSLM.io.vn không chỉ là một nền tảng rút gọn link thông thường đâu nhé! Chúng tôi tự hào là:\n\n➡️ NỀN TẢNG RÚT GỌN LINK NHANH NHẤT hiện nay! 💨\n➡️ Dễ dàng sử dụng, ai cũng dùng được, không cần phải là "chuyên gia công nghệ"! 🧑‍💻\n➡️ Giúp bạn tạo ra những đường link gọn gàng, chuyên nghiệp, dễ chia sẻ trên mọi "mặt trận" mạng xã hội! 💯\n➡️ Hoàn toàn MIỄN PHÍ để sử dụng! 🎁\n\nBạn có thể dùng SLM.io.vn để:\n\n• Chia sẻ link sản phẩm, bài viết, video một cách dễ dàng.\n• Rút gọn link affiliate, giúp bạn quản lý và theo dõi hiệu quả.\n• Tạo những đường link ngắn gọn, đẹp mắt cho các chiến dịch marketing.\n• Và còn rất nhiều ứng dụng thú vị khác đang chờ bạn khám phá! ✨\n\n👉 Bắt đầu rút gọn link ngay thôi nào! ➡️ Truy cập SLM.io.vn và trải nghiệm sự khác biệt!\n\n#SLMioVn #LinkRutGon #LinkNhanhNhat #MarketingOnline #ChiaSeDeDang #CongNgheViet #MienPhi	{http://localhost:3000/uploads/images/6b02ec4d-e0de-4834-a48f-84999e696891/86da2796-1583-4cfc-b82d-20b40775923e.png}	{facebook_page}	draft	\N	\N	{}	{"cta": "Mua ngay", "type": "social", "ratio": "1:1", "hashtags": "", "platform": "Facebook Page", "brandColor": "#0ea5e9"}	2025-11-12 07:45:55.771501+07	2025-11-12 07:45:55.771501+07	\N	none
896d75f0-f8c7-4977-915a-8bb4101d0cc4	486fdee4-7b40-453d-bb69-681b9f3f58f8	6b02ec4d-e0de-4834-a48f-84999e696891	🚀 BÙM! SLM.io.vn - NỀN TẢNG LINK RÚT GỌN NHANH NHẤT ĐÃ CÓ MẶT! 🚀\n\nChào mọi người ơi! 👋\n\nBạn có ba	🚀 BÙM! SLM.io.vn - NỀN TẢNG LINK RÚT GỌN NHANH NHẤT ĐÃ CÓ MẶT! 🚀\n\nChào mọi người ơi! 👋\n\nBạn có bao giờ cảm thấy "ức chế" vì những cái link dài ngoằng, khó nhớ, chia sẻ thì bất tiện chưa? 😫\n\nĐừng lo lắng nữa! Vì SLM.io.vn đã đến để "giải cứu" bạn khỏi tình trạng này! 😎\n\nSLM.io.vn không chỉ là một nền tảng rút gọn link thông thường đâu nhé! Chúng tôi tự hào là:\n\n➡️ NỀN TẢNG RÚT GỌN LINK NHANH NHẤT hiện nay! 💨\n➡️ Dễ dàng sử dụng, ai cũng dùng được, không cần phải là "chuyên gia công nghệ"! 🧑‍💻\n➡️ Giúp bạn tạo ra những đường link gọn gàng, chuyên nghiệp, dễ chia sẻ trên mọi "mặt trận" mạng xã hội! 💯\n➡️ Hoàn toàn MIỄN PHÍ để sử dụng! 🎁\n\nBạn có thể dùng SLM.io.vn để:\n\n• Chia sẻ link sản phẩm, bài viết, video một cách dễ dàng.\n• Rút gọn link affiliate, giúp bạn quản lý và theo dõi hiệu quả.\n• Tạo những đường link ngắn gọn, đẹp mắt cho các chiến dịch marketing.\n• Và còn rất nhiều ứng dụng thú vị khác đang chờ bạn khám phá! ✨\n\n👉 Bắt đầu rút gọn link ngay thôi nào! ➡️ Truy cập SLM.io.vn và trải nghiệm sự khác biệt!\n\n#SLMioVn #LinkRutGon #LinkNhanhNhat #MarketingOnline #ChiaSeDeDang #CongNgheViet #MienPhi	{}	{facebook_page}	published	2025-11-12 07:50:00+07	2025-11-12 07:48:54.820437+07	{}	{"cta": "Mua ngay", "type": "social", "ratio": "1:1", "hashtags": "", "platform": "Facebook Page", "brandColor": "#0ea5e9"}	2025-11-12 07:48:31.344572+07	2025-11-12 07:48:54.820437+07	\N	none
7885b2cb-36c5-41a8-b15b-2b006f063aef	cce57fee-a743-4ff6-9c90-e4953f43be26	cce57fee-a743-4ff6-9c90-e4953f43be26	BÙNG NỔ CÙNG AUTOPOSTVN - CHÌA KHÓA VÀNG CHO MỌI CHIẾN DỊCH MARKETING! 🔥\n\nChào cả nhà yêu thích kin	BÙNG NỔ CÙNG AUTOPOSTVN - CHÌA KHÓA VÀNG CHO MỌI CHIẾN DỊCH MARKETING! 🔥\n\nChào cả nhà yêu thích kinh doanh online! 👋\n\nBạn có mệt mỏi vì phải dành hàng giờ đồng hồ để đăng bài lên Facebook, Instagram và Zalo không? 😩 Cứ phải copy paste, rồi canh giờ đăng bài... tốn thời gian mà hiệu quả lại chưa cao?\n\nĐừng lo lắng nữa! 🤩 AutopostVN đã có mặt để giải quyết mọi vấn đề đó! 🎉\n\n➡️ AutopostVN là ứng dụng đăng bài TỰ ĐỘNG lên Facebook, Instagram và Zalo một cách NHANH CHÓNG và TIỆN LỢI! 🚀\n\nBạn sẽ nhận được gì khi sử dụng AutopostVN? 🤔\n\n✓ Tiết kiệm THỜI GIAN và CÔNG SỨC tối đa! 💪\n✓ Tăng TƯƠNG TÁC và tiếp cận khách hàng tiềm năng một cách hiệu quả! 📈\n✓ Quản lý nhiều tài khoản cùng lúc, dễ dàng và linh hoạt! 💯\n✓ Lên lịch đăng bài tự động, không lo bỏ lỡ bất kỳ thời điểm vàng nào! ⏰\n✓ Giao diện thân thiện, dễ sử dụng, phù hợp với mọi đối tượng! 😊\n\nAutopostVN không chỉ là một ứng dụng, mà còn là người bạn đồng hành đáng tin cậy trên con đường kinh doanh online của bạn! 🤝\n\n👉 Sẵn sàng bứt phá doanh thu cùng AutopostVN chưa?\n\n➡️ Tải ngay và trải nghiệm MIỄN PHÍ: autopostvn.cloud\n\nĐừng quên chia sẻ bài viết này đến bạn bè, người thân đang kinh doanh online để cùng nhau thành công nhé! 🥰\n\n#AutopostVN #Dangbaitudong #FacebookMarketing #InstagramMarketing #ZaloMarketing #Kinhdoanhonline #MarketingOnline #Tietkiemthoigian #Tangtuongtac #Buocphadoanhthu #Chiasemoi	{}	{facebook_page}	published	2025-11-12 08:23:00+07	2025-11-12 08:23:22.905963+07	{}	{"cta": "Mua ngay", "type": "social", "ratio": "1:1", "hashtags": "", "platform": "Facebook Page", "brandColor": "#0ea5e9"}	2025-11-12 08:21:24.581594+07	2025-11-12 08:23:22.905963+07	\N	none
c65ee78d-4383-4721-ae9b-e1acd835524a	cce57fee-a743-4ff6-9c90-e4953f43be26	cce57fee-a743-4ff6-9c90-e4953f43be26	🚀 BÙM! SLM.io.vn - NỀN TẢNG LINK RÚT GỌN NHANH NHẤT ĐÃ CÓ MẶT! 🚀\n\nChào mọi người ơi! 👋\n\nBạn có ba	🚀 BÙM! SLM.io.vn - NỀN TẢNG LINK RÚT GỌN NHANH NHẤT ĐÃ CÓ MẶT! 🚀\n\nChào mọi người ơi! 👋\n\nBạn có bao giờ cảm thấy "ức chế" vì những cái link dài ngoằng, khó nhớ, chia sẻ thì bất tiện chưa? 😫\n\nĐừng lo lắng nữa! Vì SLM.io.vn đã đến để "giải cứu" bạn khỏi tình trạng này! 😎\n\nSLM.io.vn không chỉ là một nền tảng rút gọn link thông thường đâu nhé! Chúng tôi tự hào là:\n\n➡️ NỀN TẢNG RÚT GỌN LINK NHANH NHẤT hiện nay! 💨\n➡️ Dễ dàng sử dụng, ai cũng dùng được, không cần phải là "chuyên gia công nghệ"! 🧑‍💻\n➡️ Giúp bạn tạo ra những đường link gọn gàng, chuyên nghiệp, dễ chia sẻ trên mọi "mặt trận" mạng xã hội! 💯\n➡️ Hoàn toàn MIỄN PHÍ để sử dụng! 🎁\n\nBạn có thể dùng SLM.io.vn để:\n\n• Chia sẻ link sản phẩm, bài viết, video một cách dễ dàng.\n• Rút gọn link affiliate, giúp bạn quản lý và theo dõi hiệu quả.\n• Tạo những đường link ngắn gọn, đẹp mắt cho các chiến dịch marketing.\n• Và còn rất nhiều ứng dụng thú vị khác đang chờ bạn khám phá! ✨\n\n👉 Bắt đầu rút gọn link ngay thôi nào! ➡️ Truy cập SLM.io.vn và trải nghiệm sự khác biệt!\n\n#SLMioVn #LinkRutGon #LinkNhanhNhat #MarketingOnline #ChiaSeDeDang #CongNgheViet #MienPhi	{}	{facebook_page}	published	2025-11-12 08:37:00+07	2025-11-12 08:36:20.466476+07	{}	{"cta": "Mua ngay", "type": "social", "ratio": "1:1", "hashtags": "", "platform": "Facebook Page", "brandColor": "#0ea5e9"}	2025-11-12 08:35:06.612731+07	2025-11-12 08:36:20.466476+07	\N	none
fb310129-3d4d-4411-8841-70417abde989	7a010eea-8e31-40f6-ace5-6c7aa051e9d0	3005f34d-5584-4e7c-93eb-7090240caa8f	🚀 AUTOPOTSVN - BƯỚC ĐỆM VỮNG CHẮC CHO DOANH NGHIỆP MARKETING 🚀\n\nChào mọi người! 👋\n\nBạn là chủ doa	🚀 AUTOPOTSVN - BƯỚC ĐỆM VỮNG CHẮC CHO DOANH NGHIỆP MARKETING 🚀\n\nChào mọi người! 👋\n\nBạn là chủ doanh nghiệp, người làm marketing hay đơn giản chỉ là một người muốn đưa thương hiệu của mình vươn xa? 🤩 Bạn có đang gặp khó khăn trong việc quản lý nội dung, tương tác với khách hàng trên mạng xã hội? Đừng lo lắng! AutopostVN chính là giải pháp bạn đang tìm kiếm! 😉\n\n➡️ CHÚNG TÔI LÀ AI?\n\nAutopostVN là nền tảng marketing đa năng, được thiết kế riêng cho các doanh nghiệp tại Việt Nam. Chúng tôi giúp bạn:\n\n✓ Tự động hóa đăng bài, tiết kiệm thời gian và công sức. ⏱️\n✓ Lên lịch đăng bài thông minh, tối ưu hóa thời điểm tương tác. 📅\n✓ Quản lý nhiều tài khoản mạng xã hội cùng lúc. 📱\n✓ Theo dõi và phân tích hiệu quả chiến dịch marketing. 📊\n✓ Tăng cường tương tác với khách hàng, xây dựng cộng đồng trung thành. 🥰\n\n👉 TẠI SAO NÊN CHỌN AUTOPOTSVN?\n\nChúng tôi hiểu rõ những thách thức mà các doanh nghiệp Việt Nam phải đối mặt. AutopostVN được xây dựng với những tính năng vượt trội, đáp ứng mọi nhu cầu marketing của bạn:\n\n• Giao diện thân thiện, dễ sử dụng, phù hợp với mọi đối tượng. 👍\n• Hỗ trợ đa nền tảng: Facebook, Instagram, TikTok... 🌐\n• Giá cả phải chăng, phù hợp với mọi quy mô doanh nghiệp. 💰\n• Đội ngũ hỗ trợ nhiệt tình, luôn sẵn sàng đồng hành cùng bạn. 🤝\n\n✨ BẠN SẴN SÀNG CHƯA? ✨\n\nĐừng để việc marketing trở thành gánh nặng! Hãy để AutopostVN giúp bạn chinh phục thị trường và đạt được những thành công vang dội! 🏆\n\n👉 ĐĂNG KÝ NGAY để trải nghiệm miễn phí và khám phá những tính năng tuyệt vời của AutopostVN! Link ở phần bình luận nhé! ⬇️\n\n#AutopostVN #Marketing #DoanhNghiep #SocialMedia #TuDongHoa #VietNam #DigitalMarketing #KinhDoanhOnline #ChayQuangCao #Tiktok #Facebook #Instagram #MarketingOnline #CongCuMarketing #MarketingVietNam	{}	{facebook_page}	published	2025-11-12 08:47:00+07	2025-11-12 08:47:43.018922+07	{}	{"cta": "Mua ngay", "type": "social", "ratio": "1:1", "hashtags": "", "platform": "Facebook Page", "brandColor": "#0ea5e9"}	2025-11-12 08:45:06.773311+07	2025-11-12 08:47:43.018922+07	\N	none
\.


--
-- TOC entry 5303 (class 0 OID 40854)
-- Dependencies: 220
-- Data for Name: autopostvn_social_accounts; Type: TABLE DATA; Schema: public; Owner: autopost_admin
--

COPY public.autopostvn_social_accounts (id, workspace_id, provider, provider_id, name, avatar_url, username, token_encrypted, refresh_token_encrypted, scopes, expires_at, status, last_sync_at, metadata, created_at, updated_at, platform_name) FROM stdin;
48e21cb1-2762-4f03-8fab-3c023edd50c6	123e4567-e89b-12d3-a456-426614174000	facebook	fb_page_123	Fanpage Cá»­a HÃ ng A	\N	cuahang_a	encrypted_token_fb	\N	{}	\N	connected	\N	{}	2025-11-09 14:28:03.573112+07	2025-11-09 14:28:03.573112+07	\N
016f3a3d-4e2a-462d-93a6-3fa93d086ea3	123e4567-e89b-12d3-a456-426614174000	instagram	ig_account_456	Instagram Shop B	\N	shop_b_official	encrypted_token_ig	\N	{}	\N	connected	\N	{}	2025-11-09 14:28:03.573112+07	2025-11-09 14:28:03.573112+07	\N
1fc82514-48bc-43be-af26-842fe038858a	123e4567-e89b-12d3-a456-426614174000	zalo	zalo_oa_789	Zalo OA Dá»‹ch Vá»¥ C	\N	dichvu_c_oa	encrypted_token_zalo	\N	{}	\N	connected	\N	{}	2025-11-09 14:28:03.573112+07	2025-11-09 14:28:03.573112+07	\N
854db7f0-6dab-42ba-b48f-501fdf433ded	6ee4e9eb-337c-49c7-8b13-3d34209291fd	instagram	instagram_test_1762674128059	Test Instagram Account	https://example.com/avatar.jpg	test_instagram	enc_eyJ0b2tlbiI6InRlc3RfYWNjZXNzX3Rva2VuXzE3NjI2NzQxMjgwNTkiLCJ0aW1lc3RhbXAiOiIxNzYyNjc0MTI4MDYxIn0=	enc_eyJ0b2tlbiI6InRlc3RfcmVmcmVzaF90b2tlbl8xNzYyNjc0MTI4MDU5IiwidGltZXN0YW1wIjoiMTc2MjY3NDEyODA2MSJ9	{}	2025-11-09 15:42:08.061+07	connected	\N	{"name": "Test Instagram Account", "username": "test_instagram", "providerId": "instagram_test_1762674128059", "profile_picture": "https://example.com/avatar.jpg"}	2025-11-09 14:42:08.063313+07	2025-11-09 14:42:08.063313+07	\N
4b191ac9-a64c-4241-86f7-f0aff480d1bc	486fdee4-7b40-453d-bb69-681b9f3f58f8	facebook	1992660981519521	Cuong Na Van	\N	1992660981519521	enc_eyJ0b2tlbiI6IkVBRmcxTTh1bWgwWUJQNVlKZFpBc1FqWkJ2RnFFWXp2Nml6cEo1dUFrbEc1YTNOcXNQYkFVSERNWkNyb0NueXBjMHlWSUxtSERJMldIZDVEcU5Rdm0wSE5vQ3FiVXM3dUhkWkNXcmJTMm1RWkNpY2d5d3d4VFRCaVhFcnpXeXVsMXZUVWdCWkN4UDRkcHNkSkhiRFl2aDIyd05HTDA2V2pwVnJSWkNCSGhaQkhGTnBKOGQyUlNUUkRYWkI3ejVaQ0Q5cVpDV1dsSkx6UXVRaTNBcXRDb1pCOTRubHdTeGNjUzgyYkxFZXNSeFQ2WW1GTUJyVnlEMGwzWkFjNEc0YktDQ1haQnVxSlZodzhneE9vbDEzb2VRRzhJWkNFUkQxNmxyVVhORzQzZXoxUVFHcGVQbWhLN1pDakZqTVpBUldBWkRaRCIsInRpbWVzdGFtcCI6IjE3NjI2OTM1NDA2NzgifQ==	\N	{}	\N	connected	\N	{"name": "Cuong Na Van", "category": "user", "tokenType": "user_token", "providerId": "1992660981519521"}	2025-11-09 20:05:40.689717+07	2025-11-09 20:05:40.689717+07	\N
f11a4189-ae2f-498b-a8fa-1e9b06d004a2	486fdee4-7b40-453d-bb69-681b9f3f58f8	facebook_page	849430298247182	SLM - Smart Link Manager	\N	849430298247182	enc_eyJ0b2tlbiI6IkVBRmcxTTh1bWgwWUJQMXdheUpUbFRHS2ZTNm9MMWdWWU02TVNaQmU2d01NdW1JbVlsUWRlMTJpTVpCTlJSWkFkbHc4aHZ6RE01NVBLS1R4QU5McnYyVlR5bFZHbnVaQ2NXM1dmNEZJVFVRN0pkcVl0aVRETnJ5akxHS1BLYjNrWWhtRU55ZThaQ0tEOUxKTUxlQXQ1enl2RDljNzJhRnY1ZFJ4c2pZTE1CS2sxMFpCSTcwOEZMWkNaQVNXZWZIb09KQWc2VnBTTkZyaHJ1eHdKc0p2aEtldHZsWkJOVSIsInRpbWVzdGFtcCI6IjE3NjI2OTM1NDE0MDkifQ==	\N	{}	\N	connected	\N	{"name": "SLM - Smart Link Manager", "page": {"id": "849430298247182", "name": "SLM - Smart Link Manager", "tasks": ["MODERATE", "MESSAGING", "ANALYZE", "ADVERTISE", "CREATE_CONTENT", "MANAGE"], "category": "Phần mềm", "access_token": "EAFg1M8umh0YBP1wayJTlTGKfS6oL1gVYM6MSZBe6wMMumImYlQde12iMZBNRRZAdlw8hvzDM55PKKTxANLrv2VTylVGnuZCcW3Wf4FITUQ7JdqYtiTDNryjLGKPKb3kYhmENye8ZCKD9LJMLeAt5zyvD9c72aFv5dRxsjYLMBKk10ZBI708FLZCZASWefHoOJAg6VpSNFrhruxwJsJvhKetvlZBNU"}, "category": "Phần mềm", "tokenType": "page_token", "providerId": "849430298247182"}	2025-11-09 20:05:41.41255+07	2025-11-09 20:05:41.41255+07	\N
f7aa374e-b8cb-4e4f-981c-f591eae0f50d	486fdee4-7b40-453d-bb69-681b9f3f58f8	facebook_page	758424104026962	Autopostvn	\N	758424104026962	enc_eyJ0b2tlbiI6IkVBRmcxTTh1bWgwWUJQMlhaQ1hUc1RiWkFWcGdvWkFTdVlmY3A4UFZPZnhCWkNLcG9Qc2F4MFg2V3Q4UHdTY1NmOXR2aWFITmlaQ2hxcThaQXhRN3R0WkM1VGpMUnlYek4wRlA5RTB5Nmxsb2VXNUF2VkN0VEJGNkZoSDJmQ2FhTVRRVkRYU2JvWkFtWU9XeXRwcGhMdGIyZzZJeVFaQVhXdWI5MzlRRkVMNmgxTTQxMkhmTW13dXcyMENvS1I3THFzZjRyeXdkbEgyTEpNbE9ncW0xdXcxQlZQTGxEZCIsInRpbWVzdGFtcCI6IjE3NjI2OTM1NDE0MjIifQ==	\N	{}	\N	connected	\N	{"name": "Autopostvn", "page": {"id": "758424104026962", "name": "Autopostvn", "tasks": ["ADVERTISE", "ANALYZE", "CREATE_CONTENT", "MESSAGING", "MODERATE", "MANAGE"], "category": "Sản phẩm/Dịch vụ", "access_token": "EAFg1M8umh0YBP2XZCXTsTbZAVpgoZASuYfcp8PVOfxBZCKpoPsax0X6Wt8PwScSf9tviaHNiZChqq8ZAxQ7ttZC5TjLRyXzN0FP9E0y6lloeW5AvVCtTBF6FhH2fCaaMTQVDXSboZAmYOWytpphLtb2g6IyQZAXWub939QFEL6h1M412HfMmwuw20CoKR7Lqsf4rywdlH2LJMlOgqm1uw1BVPLlDd"}, "category": "Sản phẩm/Dịch vụ", "tokenType": "page_token", "providerId": "758424104026962"}	2025-11-09 20:05:41.425414+07	2025-11-09 20:05:41.425414+07	\N
77ffede9-0b55-409c-9ecc-1d4976173a46	486fdee4-7b40-453d-bb69-681b9f3f58f8	facebook_page	2434854103192852	Hangnhatban	\N	2434854103192852	enc_eyJ0b2tlbiI6IkVBRmcxTTh1bWgwWUJQNXlGWkFXZlpCUTRiVG12UWRxYm8zV1pDYVhlYjZJTmtCbml5aENaQXZOZXdZY2kxV1ZzcWRWZGdBTFZ6eDlMZzEyelk2RjNndXozWVl0YWZ1c3Niejc4VG9oNTR6NnpEbmE2RUNwa29WV2FVTGlyM2FCRVNIM3Q0VUYwcUpWSHRnV2NWc1BwNGVhQm5aQzdJWWlrTEV4QUZDT0taQ2xGTXRSNUprRXNtUnlyNHZOMkhxbVF0UUQ3dVpCWUtuTFpCdWtHZ3VxRTA0cE9pbGpqIiwidGltZXN0YW1wIjoiMTc2MjY5MzU0MTQzNSJ9	\N	{}	\N	connected	\N	{"name": "Hangnhatban", "page": {"id": "2434854103192852", "name": "Hangnhatban", "tasks": ["MODERATE", "MESSAGING", "ANALYZE", "ADVERTISE", "CREATE_CONTENT", "MANAGE"], "category": "Vitamin/thực phẩm chức năng", "access_token": "EAFg1M8umh0YBP5yFZAWfZBQ4bTmvQdqbo3WZCaXeb6INkBniyhCZAvNewYci1WVsqdVdgALVzx9Lg12zY6F3guz3YYtafussbz78Toh54z6zDna6ECpkoVWaULir3aBESH3t4UF0qJVHtgWcVsPp4eaBnZC7IYikLExAFCOKZClFMtR5JkEsmRyr4vN2HqmQtQD7uZBYKnLZBukGguqE04pOiljj"}, "category": "Vitamin/thực phẩm chức năng", "tokenType": "page_token", "providerId": "2434854103192852"}	2025-11-09 20:05:41.438961+07	2025-11-09 20:05:41.438961+07	\N
9cde35ff-acf5-4bcd-8afd-864020df698b	486fdee4-7b40-453d-bb69-681b9f3f58f8	facebook_page	929891000491991	Công cụ hỗ trợ hóa đơn điện tử	\N	929891000491991	enc_eyJ0b2tlbiI6IkVBRmcxTTh1bWgwWUJQNkV3MkNpd1YyUGF0VTN5c0xDZUVIMWxmcm1GVUFaQ09VNk5kazRkWkFXWkFBYm5tWDFDU1BQZFRMbTR4TGdzR3dpMlNrSWxrR240bGI2SzFubXJSbVJpbnFFSjNxQkNlSUpuZE52WkFWb0QzZ1RDeUZyREJUUkt4RnVUOEFVNGNGS2FOaHdlQlF6cE10VHQ3M0x5b3M3T3paQUNKVklaQmFMTTZTYnBWNFREMWsxTTZ0UjF5WkJiWTFieE5CVmxyYVF1eEZDY2RQeHJSSWciLCJ0aW1lc3RhbXAiOiIxNzYyNjkzNTQxNDQyIn0=	\N	{}	\N	connected	\N	{"name": "Công cụ hỗ trợ hóa đơn điện tử", "page": {"id": "929891000491991", "name": "Công cụ hỗ trợ hóa đơn điện tử", "tasks": ["MODERATE", "MESSAGING", "ANALYZE", "ADVERTISE", "CREATE_CONTENT", "MANAGE"], "category": "Cộng đồng", "access_token": "EAFg1M8umh0YBP6Ew2CiwV2PatU3ysLCeEH1lfrmFUAZCOU6Ndk4dZAWZAAbnmX1CSPPdTLm4xLgsGwi2SkIlkGn4lb6K1nmrRmRinqEJ3qBCeIJndNvZAVoD3gTCyFrDBTRKxFuT8AU4cFKaNhweBQzpMtTt73Lyos7OzZACJVIZBaLM6SbpV4TD1k1M6tR1yZBbY1bxNBVlraQuxFCcdPxrRIg"}, "category": "Cộng đồng", "tokenType": "page_token", "providerId": "929891000491991"}	2025-11-09 20:05:41.444119+07	2025-11-09 20:05:41.444119+07	\N
838e22aa-40ca-4448-990f-6838267a221c	486fdee4-7b40-453d-bb69-681b9f3f58f8	facebook	test_fb_page_123	Test Facebook Page	\N	test_fb_page	test_encrypted_token_fb_123	\N	{}	\N	connected	\N	{"permissions": ["pages_manage_posts", "pages_read_engagement"], "account_type": "page"}	2025-11-12 06:35:49.707823+07	2025-11-12 06:35:49.707823+07	\N
598c455b-3ebe-4445-a269-274a1e2b99c3	df7df996-1bc1-4b7d-95c4-14847aa91920	facebook	1992660981519521	Cuong Na Van	\N	1992660981519521	enc_eyJ0b2tlbiI6IkVBRmcxTTh1bWgwWUJQNzVNWDBVV29Tc2hYMkV5SUhsRWxiNk9wcGJMVWR5a2c2TW5mQ3BZREhaQ1dVMWlYY3RsNUp4N2IzeWF6dXMwcGxvUlFTWGl6YXlaQWJpeUdGVURHc1M5NUdZdzFWSmhRY3VIdlhtODZsNXlja25YbXZLUjc3aXlxSHQwWkJ2NmtRQm1qTnhTczlMRlNEWVJjcldobzNTYlpDWUR4a21yWkMzQ3JZbE5Ha2ViWWt0WTRHcFQwVG84bU9KSFVLQkdhZ2F4ZEtzNjFFSnpMcHcyNjJHTUc5dXV3a0N2c2VZTzY5TzQ1NlNtTVhnN2hTelhQUEVaQzR5a1RGZ3VZNmd5ajNmVFlmYzFaQk81WkNUS09UZEdlZTBFNllmcVlBbTVNQ3RVWkNSalR5Z1pEWkQiLCJ0aW1lc3RhbXAiOiIxNzYyOTA5NzUwMTM3In0=	\N	{}	\N	connected	\N	{"name": "Cuong Na Van", "category": "user", "tokenType": "user_token", "providerId": "1992660981519521"}	2025-11-12 08:09:10.142802+07	2025-11-12 08:09:10.142802+07	\N
0103a86c-be11-4d45-88fe-cc951d527a19	df7df996-1bc1-4b7d-95c4-14847aa91920	facebook_page	849430298247182	SLM - Smart Link Manager	\N	849430298247182	enc_eyJ0b2tlbiI6IkVBRmcxTTh1bWgwWUJQOThoVjJITFNNQzlLU0dHTFhteVY5U2NhWkF2dWtsa3pqYWdtbmxlY25SWkJUNEJGSHNZYTVaQm1kbGltN1FSbks0dHB4TUhaQWdubG5PTkw2eER2ZU54VG5rUTRCWkJxbmgyeU5iRW1nNTFQWkF2VXNqV21Ca3F2bTRkeUt5cThNZWtieWVQSFhzSG02QUJ3RXdrVUljeklPWkFXaHZTdFA4Q1VmMFFhcVNBVElPTDlORU1KalFPa045Z2Zka1NTYm1meDZiRFRaQ3NsbjlpIiwidGltZXN0YW1wIjoiMTc2MjkwOTc1MTQ0MSJ9	\N	{}	\N	connected	\N	{"name": "SLM - Smart Link Manager", "page": {"id": "849430298247182", "name": "SLM - Smart Link Manager", "tasks": ["MODERATE", "MESSAGING", "ANALYZE", "ADVERTISE", "CREATE_CONTENT", "MANAGE"], "category": "Phần mềm", "access_token": "EAFg1M8umh0YBP98hV2HLSMC9KSGGLXmyV9ScaZAvuklkzjagmnlecnRZBT4BFHsYa5ZBmdlim7QRnK4tpxMHZAgnlnONL6xDveNxTnkQ4BZBqnh2yNbEmg51PZAvUsjWmBkqvm4dyKyq8MekbyePHXsHm6ABwEwkUIczIOZAWhvStP8CUf0QaqSATIOL9NEMJjQOkN9gfdkSSbmfx6bDTZCsln9i"}, "category": "Phần mềm", "tokenType": "page_token", "providerId": "849430298247182"}	2025-11-12 08:09:11.446948+07	2025-11-12 08:09:11.446948+07	\N
b0a501c2-badd-4690-8c63-908ae2278032	df7df996-1bc1-4b7d-95c4-14847aa91920	facebook_page	758424104026962	Autopostvn	\N	758424104026962	enc_eyJ0b2tlbiI6IkVBRmcxTTh1bWgwWUJQMkg3Nlg1R1pCZDZEUFc3QUcxS2JncDZMV1R0Tzh4RHl5amhVQlkzYnBEdHZ4ZFJwNHpDQW92ZDlVSWd6S2VlaUFYN0hONk5pZ1VDYjh2RXc0VkRMWkJzdGc0SnhwOFdaQ0x2UXYzOWdlVlpBVFpDMmp4T0RzclAzSHlxNm81OHZCWkNpdnN6eVR6cEdJRU1FQXc3WkFXVkpJZEs4c1ZSWkJ0aEtaQ0c0UFJsc3pncWs5Sk41RFBYQU9MNmlsS0lsUk5WN2YyVVpCUTZzdUVHNTkiLCJ0aW1lc3RhbXAiOiIxNzYyOTA5NzUxNDc0In0=	\N	{}	\N	connected	\N	{"name": "Autopostvn", "page": {"id": "758424104026962", "name": "Autopostvn", "tasks": ["ADVERTISE", "ANALYZE", "CREATE_CONTENT", "MESSAGING", "MODERATE", "MANAGE"], "category": "Sản phẩm/Dịch vụ", "access_token": "EAFg1M8umh0YBP2H76X5GZBd6DPW7AG1Kbgp6LWTtO8xDyyjhUBY3bpDtvxdRp4zCAovd9UIgzKeeiAX7HN6NigUCb8vEw4VDLZBstg4Jxp8WZCLvQv39geVZATZC2jxODsrP3Hyq6o58vBZCivszyTzpGIEMEAw7ZAWVJIdK8sVRZBthKZCG4PRlszgqk9JN5DPXAOL6ilKIlRNV7f2UZBQ6suEG59"}, "category": "Sản phẩm/Dịch vụ", "tokenType": "page_token", "providerId": "758424104026962"}	2025-11-12 08:09:11.479562+07	2025-11-12 08:09:11.479562+07	\N
547da622-9ae6-4ec4-a507-c34de56859d1	df7df996-1bc1-4b7d-95c4-14847aa91920	facebook_page	2434854103192852	Hangnhatban	\N	2434854103192852	enc_eyJ0b2tlbiI6IkVBRmcxTTh1bWgwWUJQM05BWkFLMTNKWkNSc3Z4cEpTdWozaEUzQXo4V213cnAzRGhiWkFNZkNCUUtEM1NwRjBtY0NCRDVXSkxYM3JLbGs2bGdRSjdIa0hORlpDb3NjY1pBdlBPNGNSYmFveUJHWkIwV201RXlaQXE5a1BCdG5WaXBSMkNCWWpQT1B3OXZGc2E4czFWMjR0RXRZSFkyUGQ2WkNuYnpkWkJjYWVkaTFvSlpBUTd2Y3NubmNubVNjZnlxdVZqUkt6WWR0ZEgyY2NUOXFpZzdhN21QclBBOFciLCJ0aW1lc3RhbXAiOiIxNzYyOTA5NzUxNDg5In0=	\N	{}	\N	connected	\N	{"name": "Hangnhatban", "page": {"id": "2434854103192852", "name": "Hangnhatban", "tasks": ["MODERATE", "MESSAGING", "ANALYZE", "ADVERTISE", "CREATE_CONTENT", "MANAGE"], "category": "Vitamin/thực phẩm chức năng", "access_token": "EAFg1M8umh0YBP3NAZAK13JZCRsvxpJSuj3hE3Az8Wmwrp3DhbZAMfCBQKD3SpF0mcCBD5WJLX3rKlk6lgQJ7HkHNFZCosccZAvPO4cRbaoyBGZB0Wm5EyZAq9kPBtnVipR2CBYjPOPw9vFsa8s1V24tEtYHY2Pd6ZCnbzdZBcaedi1oJZAQ7vcsnncnmScfyquVjRKzYdtdH2ccT9qig7a7mPrPA8W"}, "category": "Vitamin/thực phẩm chức năng", "tokenType": "page_token", "providerId": "2434854103192852"}	2025-11-12 08:09:11.49473+07	2025-11-12 08:09:11.49473+07	\N
05f1a99d-8e7e-43e5-91bb-8eb0f9e0eead	df7df996-1bc1-4b7d-95c4-14847aa91920	facebook_page	929891000491991	Công cụ hỗ trợ hóa đơn điện tử	\N	929891000491991	enc_eyJ0b2tlbiI6IkVBRmcxTTh1bWgwWUJQeVRzem1LQ2ZZbDFyaFRjS05ZendXTTNzdUNhUXQzRGhaQWVNUlpDU2FnaHBvdHNsVVJQeTQzQnhJbExYT3JMYm1lVGVlaTlKdVlMT2dSSU44ZXBkNEZielpCbzZ6ZkZSbXFvUlpCWWdISXJaQ041Szd4a2YzTUdIWFpDcEpLUnZmNENkZHNZZFpDQVRjdDVoS3VmQ1dIQUtsME54MzNmSEVVY3ZhenkzN2xoand1WHB4YlBaQW5QbkdoMmRsdW1hZXREbG1JVnVtWkFUS01hVCIsInRpbWVzdGFtcCI6IjE3NjI5MDk3NTE1MTYifQ==	\N	{}	\N	connected	\N	{"name": "Công cụ hỗ trợ hóa đơn điện tử", "page": {"id": "929891000491991", "name": "Công cụ hỗ trợ hóa đơn điện tử", "tasks": ["MODERATE", "MESSAGING", "ANALYZE", "ADVERTISE", "CREATE_CONTENT", "MANAGE"], "category": "Cộng đồng", "access_token": "EAFg1M8umh0YBPyTszmKCfYl1rhTcKNYzwWM3suCaQt3DhZAeMRZCSaghpotslURPy43BxIlLXOrLbmeTeei9JuYLOgRIN8epd4FbzZBo6zfFRmqoRZBYgHIrZCN5K7xkf3MGHXZCpJKRvf4CddsYdZCATct5hKufCWHAKl0Nx33fHEUcvazy37lhjwuXpxbPZAnPnGh2dlumaetDlmIVumZATKMaT"}, "category": "Cộng đồng", "tokenType": "page_token", "providerId": "929891000491991"}	2025-11-12 08:09:11.522743+07	2025-11-12 08:09:11.522743+07	\N
cd563754-af74-49d4-b100-0eb5a67986ca	cce57fee-a743-4ff6-9c90-e4953f43be26	facebook	1992660981519521	Cuong Na Van	\N	1992660981519521	enc_eyJ0b2tlbiI6IkVBRmcxTTh1bWgwWUJQNVJoWkNaQkd3QlZaQnVib00xQ2QzWHBXZHBLZTFRejJCTjJUVmhpYmZSd1FvUlA4cmxIeE5VUFFDcXp0YU9aQU5NcG9Jb0V3ajkxSlNVdGNTVW1jeUtkZ3JPYnBrbXlVd01DUlFUbU1FOGZxMkJObG1hWW5jNVlMMjdZWkNEQThWMVFyQlY1ODVvc0RaQmVoWFpDeUFySlNXVFZxTkw3M1FIUEFmRzVvNnFBUmFMdWdrM3oydlZWaHFpY2RHcW9jSWozdzlqdXR6SHJUUTd4WkNxb2paQnBIVEJRbzE5WVJHSEYzWkNHVENnZnR3aTlnUVpDQUZid1pBWVNiU2ZhekkybDdzNDBPTmhBWkJjMHEzYkM1Y2xtV2JRT28yVmt6MXI2NjEwc2IxOFpCWHVBWkRaRCIsInRpbWVzdGFtcCI6IjE3NjI5MTA0NDAxNzQifQ==	\N	{}	\N	connected	\N	{"name": "Cuong Na Van", "category": "user", "tokenType": "user_token", "providerId": "1992660981519521"}	2025-11-12 08:20:40.178894+07	2025-11-12 08:20:40.178894+07	\N
beeb5cce-906b-4f5d-93cc-a300c39b9482	cce57fee-a743-4ff6-9c90-e4953f43be26	facebook_page	849430298247182	SLM - Smart Link Manager	\N	849430298247182	enc_eyJ0b2tlbiI6IkVBRmcxTTh1bWgwWUJQOHViRGlqWkFQZU5nQ080dk5RcEcxN05WTWwzb0NaQVpCeUJRUnlxbmJ3WkFPWGo1YkFPQkhKQmlxOVdwN2lKNzJQTndzeWhVTjVXWFpCc2xWT1R4SVRuMVZvU3hJT1pDblBNRDd5VnBudnhuZm55ejlEV1FLR2tOZm13ZzdzQmlJNTVtVzRFODR0anAwSVpCRnNWamp2YlZIbk9YSUUzczBPbHBvYlhwSnRtNzVFSlR0TlkySENQSkcydVlNMzl5ZGRaQVE0N2xsRFZlcXRVIiwidGltZXN0YW1wIjoiMTc2MjkxMDQ0MTMyMyJ9	\N	{}	\N	connected	\N	{"name": "SLM - Smart Link Manager", "page": {"id": "849430298247182", "name": "SLM - Smart Link Manager", "tasks": ["MODERATE", "MESSAGING", "ANALYZE", "ADVERTISE", "CREATE_CONTENT", "MANAGE"], "category": "Phần mềm", "access_token": "EAFg1M8umh0YBP8ubDijZAPeNgCO4vNQpG17NVMl3oCZAZByBQRyqnbwZAOXj5bAOBHJBiq9Wp7iJ72PNwsyhUN5WXZBslVOTxITn1VoSxIOZCnPMD7yVpnvxnfnyz9DWQKGkNfmwg7sBiI55mW4E84tjp0IZBFsVjjvbVHnOXIE3s0OlpobXpJtm75EJTtNY2HCPJG2uYM39yddZAQ47llDVeqtU"}, "category": "Phần mềm", "tokenType": "page_token", "providerId": "849430298247182"}	2025-11-12 08:20:41.325543+07	2025-11-12 08:20:41.325543+07	\N
9a8f8308-7981-4f86-b560-f18cd44c6e4f	cce57fee-a743-4ff6-9c90-e4953f43be26	facebook_page	758424104026962	Autopostvn	\N	758424104026962	enc_eyJ0b2tlbiI6IkVBRmcxTTh1bWgwWUJQMXZtZ0dnOFRqeTl0WkN5ZGUyajk1ckNlWWt5WkN0VmtNTVhhQ3MzUlVGM290ZE4yNnBmNjlpSmZ6WkJORUp1bEJZS2lZYWxaQzZjOWJBVWlCTXlrMU0xR3BDNGVLUms1MkZUVGxFa2prTzNkSEFFeGlneDlCRGg5WHlaQ2FIVlVGTG9tRjRIcGE5SmlncmZnbVB3VnVRMjZ0NmdaQ1pBVEZTWkNDUzlWd09MVzhBYnJrbnVnUVF4SlpDME5ISW9XZHNKNnpITmRMWHpNckhaQU0iLCJ0aW1lc3RhbXAiOiIxNzYyOTEwNDQxMzMzIn0=	\N	{}	\N	connected	\N	{"name": "Autopostvn", "page": {"id": "758424104026962", "name": "Autopostvn", "tasks": ["ADVERTISE", "ANALYZE", "CREATE_CONTENT", "MESSAGING", "MODERATE", "MANAGE"], "category": "Sản phẩm/Dịch vụ", "access_token": "EAFg1M8umh0YBP1vmgGg8Tjy9tZCyde2j95rCeYkyZCtVkMMXaCs3RUF3otdN26pf69iJfzZBNEJulBYKiYalZC6c9bAUiBMyk1M1GpC4eKRk52FTTlEkjkO3dHAExigx9BDh9XyZCaHVUFLomF4Hpa9JigrfgmPwVuQ26t6gZCZATFSZCCS9VwOLW8AbrknugQQxJZC0NHIoWdsJ6zHNdLXzMrHZAM"}, "category": "Sản phẩm/Dịch vụ", "tokenType": "page_token", "providerId": "758424104026962"}	2025-11-12 08:20:41.336336+07	2025-11-12 08:20:41.336336+07	\N
84ed9410-b4f7-454b-81ba-a6d576472bb2	cce57fee-a743-4ff6-9c90-e4953f43be26	facebook_page	2434854103192852	Hangnhatban	\N	2434854103192852	enc_eyJ0b2tlbiI6IkVBRmcxTTh1bWgwWUJQMEdsY3pOWDk0OGRxS2VOMndmWkFaQmcyU0o4bXZScWpSRlR0UXVhSlZxV0NJcGNaQ21aQ1lhU1NjWWlqeW9wZUxwT3JFeDdYTGhaQ2JpaFFrcmV2VEJjR1Q0WkFaQTh6N1N0YlBMc09GWVBUS0prS1RnOXhOd3Q4M1hQRHR2TlNXWkNQNlBxS283VEMzeVdmQUdWOUVwM0hiSGRxQVFqOExsNnNFM2c4Y2RlWkFVNHdRR0w4UlJYRExEWGJVTmlvcHUwRWFrNUlaQ0xVb29aQmMwIiwidGltZXN0YW1wIjoiMTc2MjkxMDQ0MTM0MiJ9	\N	{}	\N	connected	\N	{"name": "Hangnhatban", "page": {"id": "2434854103192852", "name": "Hangnhatban", "tasks": ["MODERATE", "MESSAGING", "ANALYZE", "ADVERTISE", "CREATE_CONTENT", "MANAGE"], "category": "Vitamin/thực phẩm chức năng", "access_token": "EAFg1M8umh0YBP0GlczNX948dqKeN2wfZAZBg2SJ8mvRqjRFTtQuaJVqWCIpcZCmZCYaSScYijyopeLpOrEx7XLhZCbihQkrevTBcGT4ZAZA8z7StbPLsOFYPTKJkKTg9xNwt83XPDtvNSWZCP6PqKo7TC3yWfAGV9Ep3HbHdqAQj8Ll6sE3g8cdeZAU4wQGL8RRXDLDXbUNiopu0Eak5IZCLUooZBc0"}, "category": "Vitamin/thực phẩm chức năng", "tokenType": "page_token", "providerId": "2434854103192852"}	2025-11-12 08:20:41.345067+07	2025-11-12 08:20:41.345067+07	\N
80b362a4-a32a-4a39-a8bd-41057de89c6c	cce57fee-a743-4ff6-9c90-e4953f43be26	facebook_page	929891000491991	Công cụ hỗ trợ hóa đơn điện tử	\N	929891000491991	enc_eyJ0b2tlbiI6IkVBRmcxTTh1bWgwWUJQNFlKS0VXS0hhZVUzbGxKWEZteUN4N01RRW9LWEVaQ3FLbzFjQUlXRXFFZVdVeHlhWkJTN1pCb3hHa28yM0ppcVpBc1daQVRUTXhZWExIY3lxZVAxTmxUUlJLS1VsYXpRdUhGWDVBUThORTlOM3pWZUFoZ1pBZndIeXBqMEZUbWo4ZkRVbkRqdnJhZnM3WkJDT2FvQ2dQUnZjT1Z5elZuMFk2WkI0ejNyN0ZNa09YWkN2d1lDM08zdzFlMGdwUFpCalpCQ3I1aFpCV0VYc0tzM0JaQ2wiLCJ0aW1lc3RhbXAiOiIxNzYyOTEwNDQxMzUxIn0=	\N	{}	\N	connected	\N	{"name": "Công cụ hỗ trợ hóa đơn điện tử", "page": {"id": "929891000491991", "name": "Công cụ hỗ trợ hóa đơn điện tử", "tasks": ["MODERATE", "MESSAGING", "ANALYZE", "ADVERTISE", "CREATE_CONTENT", "MANAGE"], "category": "Cộng đồng", "access_token": "EAFg1M8umh0YBP4YJKEWKHaeU3llJXFmyCx7MQEoKXEZCqKo1cAIWEqEeWUxyaZBS7ZBoxGko23JiqZAsWZATTMxYXLHcyqeP1NlTRRKKUlazQuHFX5AQ8NE9N3zVeAhgZAfwHypj0FTmj8fDUnDjvrafs7ZBCOaoCgPRvcOVyzVn0Y6ZB4z3r7FMkOXZCvwYC3O3w1e0gpPZBjZBCr5hZBWEXsKs3BZCl"}, "category": "Cộng đồng", "tokenType": "page_token", "providerId": "929891000491991"}	2025-11-12 08:20:41.354192+07	2025-11-12 08:20:41.354192+07	\N
fe3d0f0d-0718-4475-9c21-afcf653169ff	7a010eea-8e31-40f6-ace5-6c7aa051e9d0	facebook	1992660981519521	Cuong Na Van	\N	1992660981519521	enc_eyJ0b2tlbiI6IkVBRmcxTTh1bWgwWUJQeE1aQ1NMWkNsWkNVbGxTNERqeHQyN1pDQlFXcG5KTFVicFRiczZtVjVaQ3FYVWJsY1lpcjdKekVaQlpDdU5iZ3kxTmJ1MlpCYjkxbHd4RHN6WkJwVG9nbUJ2RUQ4S3VYNklRbGk1WUU5NThHWUdUQnBLamZHYnBocVlhWFhldElXU0NGY1RidjdmUTdKRzQwRjNvQTlxU2RBVWFUWGFpaFJJalhNZzYxWUpSTUU2QUdjWXRIZFNlTHlucW5pY2tIbU9oYnBVRXZVY0pTelpDT3MxT0RPTjRpbjZObWk5T0xEUGxVc2w2SklMZnczV1BJRG96OTRDd1pDaUNFSHg2UlpDY2JUWkNqdVh6YVVhbmFYUTh3R0VaQVdrT0FENTExaGhLazF0bGtoUnpMSDZnWkRaRCIsInRpbWVzdGFtcCI6IjE3NjI5MTE4Mjc5NTYifQ==	\N	{}	\N	connected	\N	{"name": "Cuong Na Van", "category": "user", "tokenType": "user_token", "providerId": "1992660981519521"}	2025-11-12 08:43:47.969466+07	2025-11-12 08:43:47.969466+07	\N
e2472520-cfcc-4f64-9f16-0910c31fba14	7a010eea-8e31-40f6-ace5-6c7aa051e9d0	facebook_page	849430298247182	SLM - Smart Link Manager	\N	849430298247182	enc_eyJ0b2tlbiI6IkVBRmcxTTh1bWgwWUJQM21wTVpDUHE2UUhyUmFYQWQwOTRnSGdpWkFFNzlleHRxTWdxNjhmMWlVQUUxVmhsa1YzSWt3NEJVR1VXYVlUT2txdldoeHptZDkzNFU1WGxZS0ZLcXFRRGZsWXZYSnJOMFg3dFNNblpCbkdWbnpNM3NaQ3BrUkJFdHROUnVJMVA3QTRaQ0k0VXFOaUVuQjByWUdaQk40WkNCM3dwc1FzSDlSTkgzNUFYSW5nOVpCaGFraWZ2b3QxempxYnRndmthQVFFQ2pOUllodnRkelpBTSIsInRpbWVzdGFtcCI6IjE3NjI5MTE4MjkxNDIifQ==	\N	{}	\N	connected	\N	{"name": "SLM - Smart Link Manager", "page": {"id": "849430298247182", "name": "SLM - Smart Link Manager", "tasks": ["MODERATE", "MESSAGING", "ANALYZE", "ADVERTISE", "CREATE_CONTENT", "MANAGE"], "category": "Phần mềm", "access_token": "EAFg1M8umh0YBP3mpMZCPq6QHrRaXAd094gHgiZAE79extqMgq68f1iUAE1VhlkV3Ikw4BUGUWaYTOkqvWhxzmd934U5XlYKFKqqQDflYvXJrN0X7tSMnZBnGVnzM3sZCpkRBEttNRuI1P7A4ZCI4UqNiEnB0rYGZBN4ZCB3wpsQsH9RNH35AXIng9ZBhakifvot1zjqbtgvkaAQECjNRYhvtdzZAM"}, "category": "Phần mềm", "tokenType": "page_token", "providerId": "849430298247182"}	2025-11-12 08:43:49.147309+07	2025-11-12 08:43:49.147309+07	\N
b6017ffc-7b87-4b26-b181-29cc17adc71d	7a010eea-8e31-40f6-ace5-6c7aa051e9d0	facebook_page	758424104026962	Autopostvn	\N	758424104026962	enc_eyJ0b2tlbiI6IkVBRmcxTTh1bWgwWUJQeUtBQ1dCelVaQnVnYnhOS1Y2b0tPekdTR3BIOGJDYVdYaXF2cE9XbGZIVjU4a0h6MEZsSGxEWXpwV1RVWHhLMFVQb3BQWkJNM1N5WkJldk5aQUJBM1BhVTBhUDN3OUl0SjZlQ0dZNjNaQlpBeFdqTnc1Rm1wWGlSUkx4MDJCMFpCVEIzajd5NTdUT1g1N2M5c1hvNW5nS0VsbDFlQ3l2SHpWVk9qSkhZblVIMDZGbVZ1dFpDZTRjUUVaQUFCNG9DTndnN0kzQ1JyWkMxc1F5WGwiLCJ0aW1lc3RhbXAiOiIxNzYyOTExODI5MTYxIn0=	\N	{}	\N	connected	\N	{"name": "Autopostvn", "page": {"id": "758424104026962", "name": "Autopostvn", "tasks": ["ADVERTISE", "ANALYZE", "CREATE_CONTENT", "MESSAGING", "MODERATE", "MANAGE"], "category": "Sản phẩm/Dịch vụ", "access_token": "EAFg1M8umh0YBPyKACWBzUZBugbxNKV6oKOzGSGpH8bCaWXiqvpOWlfHV58kHz0FlHlDYzpWTUXxK0UPopPZBM3SyZBevNZABA3PaU0aP3w9ItJ6eCGY63ZBZAxWjNw5FmpXiRRLx02B0ZBTB3j7y57TOX57c9sXo5ngKEll1eCyvHzVVOjJHYnUH06FmVutZCe4cQEZAAB4oCNwg7I3CRrZC1sQyXl"}, "category": "Sản phẩm/Dịch vụ", "tokenType": "page_token", "providerId": "758424104026962"}	2025-11-12 08:43:49.166164+07	2025-11-12 08:43:49.166164+07	\N
521b7aa2-0ef0-4f1c-8f6a-054e4c569c54	7a010eea-8e31-40f6-ace5-6c7aa051e9d0	facebook_page	2434854103192852	Hangnhatban	\N	2434854103192852	enc_eyJ0b2tlbiI6IkVBRmcxTTh1bWgwWUJQNGxlWkJ4UmpPaU9UbmJucXMzU2RrZjRZcFRnSVAyUFY2TjdvT3U1anFONWxmUW9uNW9aQmxuVThVOGhlWkIxRm5aQXBrN2oxWkJmVVdOYjNDNTBsOEVGZlJFSWh3OHdYZmlpZmxyR1RraXhQZlpBQXVUc3pla3l0SlRBUVNoNVRTblhORVJwS25NdFN3QmdkbUVocXRhdjZTRkpMYVpBemQ3TFFQdlpBNmIybndSRksxM2o5Q1VsdFdUVmJ6cDBMOHZqWkIxdXJ6WWJET2p3VSIsInRpbWVzdGFtcCI6IjE3NjI5MTE4MjkxODgifQ==	\N	{}	\N	connected	\N	{"name": "Hangnhatban", "page": {"id": "2434854103192852", "name": "Hangnhatban", "tasks": ["MODERATE", "MESSAGING", "ANALYZE", "ADVERTISE", "CREATE_CONTENT", "MANAGE"], "category": "Vitamin/thực phẩm chức năng", "access_token": "EAFg1M8umh0YBP4leZBxRjOiOTnbnqs3Sdkf4YpTgIP2PV6N7oOu5jqN5lfQon5oZBlnU8U8heZB1FnZApk7j1ZBfUWNb3C50l8EFfREIhw8wXfiiflrGTkixPfZAAuTszekytJTAQSh5TSnXNERpKnMtSwBgdmEhqtav6SFJLaZAzd7LQPvZA6b2nwRFK13j9CUltWTVbzp0L8vjZB1urzYbDOjwU"}, "category": "Vitamin/thực phẩm chức năng", "tokenType": "page_token", "providerId": "2434854103192852"}	2025-11-12 08:43:49.191439+07	2025-11-12 08:43:49.191439+07	\N
63c7551a-d894-4bb5-933e-da28ee1dc16d	7a010eea-8e31-40f6-ace5-6c7aa051e9d0	facebook_page	929891000491991	Công cụ hỗ trợ hóa đơn điện tử	\N	929891000491991	enc_eyJ0b2tlbiI6IkVBRmcxTTh1bWgwWUJQd2p5SEdCRFc0R2ZaQ3ZPS205YVh6M2ZJQXNmaFZyaFRhbnlmblpCRndIV2lDWVRtVHJ6c0JoSlpBT2xHTzBXRFNyS1hLYVBoQUttMEdjbWlmVGJtWkJEenF2eFZHUTVFeFAxWUdPZkdFWkJqa1lOWkNuM1pCcWhKaEpuUU14bHJiM2puNjZyamNsaE9mWTNzNmZRdXFnSnZITUNTMjZQZTNCeDBLc1pBZEpQRUczWUkydGlCSjJURHdVd0pzWkFVMVNHRFpDUFhhY1RmQlZZVjYiLCJ0aW1lc3RhbXAiOiIxNzYyOTExODI5MTk2In0=	\N	{}	\N	connected	\N	{"name": "Công cụ hỗ trợ hóa đơn điện tử", "page": {"id": "929891000491991", "name": "Công cụ hỗ trợ hóa đơn điện tử", "tasks": ["MODERATE", "MESSAGING", "ANALYZE", "ADVERTISE", "CREATE_CONTENT", "MANAGE"], "category": "Cộng đồng", "access_token": "EAFg1M8umh0YBPwjyHGBDW4GfZCvOKm9aXz3fIAsfhVrhTanyfnZBFwHWiCYTmTrzsBhJZAOlGO0WDSrKXKaPhAKm0GcmifTbmZBDzqvxVGQ5ExP1YGOfGEZBjkYNZCn3ZBqhJhJnQMxlrb3jn66rjclhOfY3s6fQuqgJvHMCS26Pe3Bx0KsZAdJPEG3YI2tiBJ2TDwUwJsZAU1SGDZCPXacTfBVYV6"}, "category": "Cộng đồng", "tokenType": "page_token", "providerId": "929891000491991"}	2025-11-12 08:43:49.199543+07	2025-11-12 08:43:49.199543+07	\N
\.


--
-- TOC entry 5320 (class 0 OID 41280)
-- Dependencies: 238
-- Data for Name: autopostvn_system_activity_logs; Type: TABLE DATA; Schema: public; Owner: autopost_admin
--

COPY public.autopostvn_system_activity_logs (id, user_id, workspace_id, action_type, action_category, description, target_resource_type, target_resource_id, previous_data, new_data, ip_address, user_agent, request_id, session_id, status, error_message, duration_ms, additional_data, created_at) FROM stdin;
fe1d61a4-b964-46bb-bb61-86996eb127d4	486fdee4-7b40-453d-bb69-681b9f3f58f8	\N	post_failed	post	Lỗi tạo bài đăng: "Smart link manager, ứng dụng link rút gọn thông minh" - Failed to create post	post	\N	{}	{"title": "Smart link manager, ứng dụng link rút gọn thông minh", "error_message": "Failed to create post"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	9b51c5f2-81a7-4b9c-871a-5a0821e68ef9	486fdee4-7b40-453d-bb69-681b9f3f58f8	failed	\N	0	{"platforms": ["facebook"], "error_type": "unknown"}	2025-11-09 16:44:21.792243+07
c9c1c16d-6690-4a31-8c03-18a2dcf39538	486fdee4-7b40-453d-bb69-681b9f3f58f8	\N	post_failed	post	Lỗi tạo bài đăng: "Smart Link Manager, phần mền rút gọn link và A/B tesing" - Failed to create post	post	\N	{}	{"title": "Smart Link Manager, phần mền rút gọn link và A/B tesing", "error_message": "Failed to create post"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	5b6415ba-860d-4921-a13c-53b4f056d715	486fdee4-7b40-453d-bb69-681b9f3f58f8	failed	\N	0	{"platforms": ["facebook"], "error_type": "unknown"}	2025-11-09 18:54:41.501293+07
b9a10992-970c-4662-84e7-776dc0f8a724	486fdee4-7b40-453d-bb69-681b9f3f58f8	\N	post_created	post	Created post: 5ed25daa-b50a-42a3-8196-4c7b56149836	post	5ed25daa-b50a-42a3-8196-4c7b56149836	{}	{}	\N	\N	\N	\N	success	\N	\N	{}	2025-11-09 19:01:37.461934+07
696261ec-ffb2-4a6d-a2bf-89b428eacb66	486fdee4-7b40-453d-bb69-681b9f3f58f8	\N	post_scheduled	post	Lên lịch đăng bài: "Không có tiêu đề" vào 21:01:00 9/11/2025	post	\N	{}	{"title": "", "platforms": ["facebook"], "scheduled_time": "2025-11-09T21:01"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	64005e40-2f61-412d-9430-fc8119557dbd	486fdee4-7b40-453d-bb69-681b9f3f58f8	success	\N	0	{"platforms": ["facebook"], "scheduled_for": "2025-11-09T21:01"}	2025-11-09 19:01:39.492801+07
3713c470-2afb-477a-8101-71ab6bf601b8	486fdee4-7b40-453d-bb69-681b9f3f58f8	\N	post_failed	post	Lỗi tạo bài đăng: "Không có tiêu đề" - No workspace found. Please create a workspace first.	post	\N	{}	{"title": "", "error_message": "No workspace found. Please create a workspace first."}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	b8908213-d78c-426b-9ea9-5cd9237268e8	486fdee4-7b40-453d-bb69-681b9f3f58f8	failed	\N	0	{"platforms": ["facebook"], "error_type": "unknown"}	2025-11-09 19:38:21.977475+07
6a0b305d-2ca6-4397-9c1d-7479faa791b8	6b02ec4d-e0de-4834-a48f-84999e696891	486fdee4-7b40-453d-bb69-681b9f3f58f8	post_deleted	post	Deleted post: 5ed25daa-b50a-42a3-8196-4c7b56149836	post	5ed25daa-b50a-42a3-8196-4c7b56149836	{}	{}	\N	\N	\N	\N	success	\N	\N	{}	2025-11-09 19:42:12.399238+07
3ad0beb3-0975-4150-aad9-fc399ac5cdc1	6b02ec4d-e0de-4834-a48f-84999e696891	\N	post_deleted	post	Xóa bài đăng: "🚀 CHÀO MỪNG ĐẾN VỚI THẾ GIỚI CỦA SMART LINK MANAG" (facebook_page, instagram)	post	5ed25daa-b50a-42a3-8196-4c7b56149836	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	a75e89b9-a2cc-4462-a5f1-c3db0f6affce	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	1	{"title": "🚀 CHÀO MỪNG ĐẾN VỚI THẾ GIỚI CỦA SMART LINK MANAG", "providers": ["facebook_page", "instagram"], "content_length": 1987, "scheduled_time": "2025-11-09T12:01:37.450Z"}	2025-11-09 19:42:12.462025+07
3b2b0846-0d57-4ef7-93bc-de0e3d271b43	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	2f584876-e471-40de-840b-73b1ceb63e6f	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-09 19:57:39.75777+07
96501301-1129-4dbe-be0a-59b9d587aab8	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	cf1bafa2-1b46-4c6b-9da1-6c9ff3c60def	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-09 19:57:39.832688+07
1a0188a6-3d49-4487-bd7a-38e78bd15485	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	0b435d54-7c8d-4eef-8b8a-6dffb61397f4	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-09 19:58:43.219952+07
db1eca39-f252-46a3-9eef-ca9c3d70ae6b	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	c5e349a3-c01b-4351-8ed0-7765f52375dc	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-09 19:58:43.221403+07
791243b0-1408-41a0-94e6-ee9a1ba29a7a	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	f3b683e0-bdf9-45c5-bc39-b7e58cfa1087	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-09 19:59:31.113895+07
76436c7e-497f-4106-a025-176c320c09b5	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	8a978c31-d4f6-4d82-9d43-d84a25fa7515	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-09 19:59:31.116355+07
bd60090b-01d0-47f0-ad9c-377808787902	6b02ec4d-e0de-4834-a48f-84999e696891	\N	account_disconnected	account	Ngắt kết nối tài khoản instagram: Test Instagram	social_account	437bc323-79a3-47d2-9796-09d5b28407eb	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	46a42362-83f0-4207-87c1-504ed694366b	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"provider": "instagram", "account_name": "Test Instagram"}	2025-11-09 19:59:31.277752+07
0c156e9d-e7ac-4263-96a8-782347ec11b1	6b02ec4d-e0de-4834-a48f-84999e696891	\N	account_disconnected	account	Ngắt kết nối tài khoản facebook_page: Test Facebook Page	social_account	d06ee038-4a42-4368-93ca-b4f9714023d6	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	6d87a56f-0d4c-46f3-bbd5-7947c6b1247c	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"provider": "facebook_page", "account_name": "Test Facebook Page"}	2025-11-09 19:59:32.274692+07
97d70852-8e0c-4de1-9ba2-9e0ff1bf12f6	6b02ec4d-e0de-4834-a48f-84999e696891	486fdee4-7b40-453d-bb69-681b9f3f58f8	post_created	post	Created post: ae7ebbdd-2033-478d-a4eb-944443892728	post	ae7ebbdd-2033-478d-a4eb-944443892728	{}	{}	\N	\N	\N	\N	success	\N	\N	{}	2025-11-12 06:04:48.199516+07
064f6728-bba3-43bb-8c4c-8b9566cc0ef9	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	db106058-b939-4872-b872-277990d5c944	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-09 20:05:53.69655+07
1cb7b4b9-d489-493d-82ae-116c156723bf	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	856fc4b8-1db4-47a6-b2e2-cb1ed2f4400a	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-09 20:05:53.738719+07
e4640559-0fe5-4fd7-bd73-8dcd36584048	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	927c982e-cfc9-4c74-b054-fc83cfa0e5aa	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-10 21:58:34.799457+07
ebeb8e99-ebb6-465c-a2a8-2fa1749de7bf	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	67ecacf6-0a95-4c56-b27d-59ce441d81b4	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-10 21:58:34.943401+07
58c21ed9-136b-482e-9d31-bea28540f4e2	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	1eac7dc7-22ba-47f8-b2ae-02fa948264ed	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-10 22:04:02.687383+07
1a155769-f2fe-4c83-bc2d-e92379d71a2f	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	5867b6ef-f023-480f-a34e-75ad6a54fa68	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-10 22:04:02.760996+07
cb669f41-4f06-4402-9e10-f3a231b9f156	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	7475d198-05ed-4613-a737-41724cb34762	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-10 22:04:12.409655+07
272e24a9-bf22-4f98-bb5b-fc3810ecb044	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	7725f0cd-4ef3-4521-84ee-78263b4aa8e4	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-10 22:04:12.534407+07
8c09581c-215d-45a9-ab6a-47c3c606bef4	6b02ec4d-e0de-4834-a48f-84999e696891	486fdee4-7b40-453d-bb69-681b9f3f58f8	post_deleted	post	Deleted post: a8ce5acb-889a-4d44-8ea6-db440289fb45	post	a8ce5acb-889a-4d44-8ea6-db440289fb45	{}	{}	\N	\N	\N	\N	success	\N	\N	{}	2025-11-10 22:04:36.010474+07
27f75c3d-12fa-45a2-a850-5f0b5dc1431b	6b02ec4d-e0de-4834-a48f-84999e696891	\N	post_deleted	post	Xóa bài đăng: "Đây là bài test tự động post từ scheduler. Bài này" (facebook_page, facebook)	post	a8ce5acb-889a-4d44-8ea6-db440289fb45	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	f346cd4d-4df7-4c09-bf0d-2ec63101e05d	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"title": "Đây là bài test tự động post từ scheduler. Bài này", "providers": ["facebook_page", "facebook"], "content_length": 89, "scheduled_time": "2025-11-10T14:56:29.203Z"}	2025-11-10 22:04:36.101218+07
699e164f-018c-49e5-9fb4-d5cd7731c116	6b02ec4d-e0de-4834-a48f-84999e696891	486fdee4-7b40-453d-bb69-681b9f3f58f8	post_deleted	post	Deleted post: b0b66c22-7798-4685-b919-470daa0c650e	post	b0b66c22-7798-4685-b919-470daa0c650e	{}	{}	\N	\N	\N	\N	success	\N	\N	{}	2025-11-10 22:04:40.636093+07
95cc95ea-71fc-49e7-a2e2-b64ba1776e07	6b02ec4d-e0de-4834-a48f-84999e696891	\N	post_deleted	post	Xóa bài đăng: "Đây là bài test tự động post từ scheduler. Bài này" (facebook, facebook_page)	post	b0b66c22-7798-4685-b919-470daa0c650e	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	55f50ddd-acd1-4ed9-bf78-fdd5ef4893f9	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"title": "Đây là bài test tự động post từ scheduler. Bài này", "providers": ["facebook", "facebook_page"], "content_length": 89, "scheduled_time": "2025-11-10T15:03:12.837Z"}	2025-11-10 22:04:40.72344+07
f1095606-7406-4225-95f2-73311b21d61c	6b02ec4d-e0de-4834-a48f-84999e696891	\N	post_failed	post	Lỗi tạo bài đăng: "AutopostVN ứng dụng post bài tự động lên Facebook và Instagram, Zalo một cách nhanh chóng" - Failed to create post	post	\N	{}	{"title": "AutopostVN ứng dụng post bài tự động lên Facebook và Instagram, Zalo một cách nhanh chóng", "error_message": "Failed to create post"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	e6087633-dace-4743-9fb7-6c2afce93306	6b02ec4d-e0de-4834-a48f-84999e696891	failed	\N	0	{"platforms": ["facebook", "instagram"], "error_type": "unknown"}	2025-11-10 22:06:43.203548+07
aef177ac-d42b-4e81-a003-fc4b2dd1d691	6b02ec4d-e0de-4834-a48f-84999e696891	486fdee4-7b40-453d-bb69-681b9f3f58f8	post_created	post	Created post: ce846f52-8b37-4f30-93f3-0dfa9c3993fc	post	ce846f52-8b37-4f30-93f3-0dfa9c3993fc	{}	{}	\N	\N	\N	\N	success	\N	\N	{}	2025-11-10 22:08:47.564348+07
6b40460b-6537-4e2d-9ee7-a709fa303d37	6b02ec4d-e0de-4834-a48f-84999e696891	\N	post_scheduled	post	Lên lịch đăng bài: "AutopostVN ứng dụng post bài tự động lên Facebook và Instagram, Zalo một cách nhanh chóng" vào 22:08:00 10/11/2025	post	\N	{}	{"title": "AutopostVN ứng dụng post bài tự động lên Facebook và Instagram, Zalo một cách nhanh chóng", "platforms": ["facebook", "instagram"], "scheduled_time": "2025-11-10T22:08"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	b433d368-3805-4c7f-b89e-69a0d7a4b0b3	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"platforms": ["facebook", "instagram"], "scheduled_for": "2025-11-10T22:08"}	2025-11-10 22:08:49.707093+07
708cdafc-9dad-494e-9ee3-f0f71f0a453e	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	23b63dc6-12af-4893-a46f-9a5fa5cdcf22	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-10 22:09:22.320292+07
adbc28c8-cd32-4ade-bee1-0fe56c6c6832	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	eb6e57aa-8b26-436c-b148-b0d6aa5d3e1c	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-10 22:09:22.436993+07
cb06c27b-fd16-4a76-b04a-cb61652ec270	6b02ec4d-e0de-4834-a48f-84999e696891	486fdee4-7b40-453d-bb69-681b9f3f58f8	post_deleted	post	Deleted post: ce846f52-8b37-4f30-93f3-0dfa9c3993fc	post	ce846f52-8b37-4f30-93f3-0dfa9c3993fc	{}	{}	\N	\N	\N	\N	success	\N	\N	{}	2025-11-10 22:17:23.70399+07
57185223-4cc8-4dfa-9b93-3b740eb655ec	6b02ec4d-e0de-4834-a48f-84999e696891	\N	post_deleted	post	Xóa bài đăng: "🔥 BÙNG NỔ CÙNG AUTOPOSTVN - CHÌA KHÓA VÀNG CHO MỌ" (facebook_page)	post	ce846f52-8b37-4f30-93f3-0dfa9c3993fc	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	6d5bb395-f889-4aad-bc26-0bf937582b59	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"title": "🔥 BÙNG NỔ CÙNG AUTOPOSTVN - CHÌA KHÓA VÀNG CHO MỌ", "providers": ["facebook_page"], "content_length": 1381, "scheduled_time": "2025-11-10T15:08:47.518Z"}	2025-11-10 22:17:26.97399+07
8f058a0c-7468-4739-8db5-fbd125d9ec0f	6b02ec4d-e0de-4834-a48f-84999e696891	486fdee4-7b40-453d-bb69-681b9f3f58f8	post_deleted	post	Deleted post: 358efaa9-e384-44ab-a7f1-5a6cee1647af	post	358efaa9-e384-44ab-a7f1-5a6cee1647af	{}	{}	\N	\N	\N	\N	success	\N	\N	{}	2025-11-10 22:17:29.056141+07
00ef6dfa-daea-446a-a1a0-af53e0814ce2	6b02ec4d-e0de-4834-a48f-84999e696891	\N	post_deleted	post	Xóa bài đăng: "🔥 BÙNG NỔ CÙNG AUTOPOSTVN - CHÌA KHÓA VÀNG CHO MỌ"	post	358efaa9-e384-44ab-a7f1-5a6cee1647af	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	678b6f18-00f5-4605-a4a7-e7d96eeb2b6e	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"title": "🔥 BÙNG NỔ CÙNG AUTOPOSTVN - CHÌA KHÓA VÀNG CHO MỌ", "providers": [], "content_length": 1381, "scheduled_time": "2025-11-10T15:06:42.984Z"}	2025-11-10 22:17:29.166674+07
36bfe48a-1fb4-418e-a8fa-75f0ec14208a	6b02ec4d-e0de-4834-a48f-84999e696891	486fdee4-7b40-453d-bb69-681b9f3f58f8	post_created	post	Created post: 8eb9f32d-edc5-4bc2-84a1-abeeed4334cd	post	8eb9f32d-edc5-4bc2-84a1-abeeed4334cd	{}	{}	\N	\N	\N	\N	success	\N	\N	{}	2025-11-10 22:18:12.753521+07
7422832c-9a99-4820-a42e-9bd196fa6060	6b02ec4d-e0de-4834-a48f-84999e696891	\N	post_scheduled	post	Lên lịch đăng bài: "Không có tiêu đề" vào 22:20:00 10/11/2025	post	\N	{}	{"title": "", "platforms": ["facebook"], "scheduled_time": "2025-11-10T22:20"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	1fc4d77b-e1e6-4d22-b3b8-85decc745d9b	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"platforms": ["facebook"], "scheduled_for": "2025-11-10T22:20"}	2025-11-10 22:18:12.891807+07
b537f0ed-68cc-4124-88a8-cb77dedd238a	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	0c19fb15-3e37-4949-b9bd-0dc1c5c4ac86	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-10 22:18:59.303416+07
a81169cb-7c13-4ccd-b711-49bb5514a8fd	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	aee4e382-0c85-4564-8673-da1efabf1421	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-10 22:18:59.440364+07
a98623dc-c0bd-4ecc-8c42-c86657d4a8f9	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	3655bbdb-ee81-4ef4-80e7-60c60f089702	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-10 22:38:16.060707+07
002aecf8-7ccc-4c75-bbe1-14107f45e958	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	feee892a-7844-481b-9ec7-2d315fc6eb51	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-10 22:38:16.09227+07
27c65e3c-7fdb-4e14-ba2b-b92dc8a5aa24	6b02ec4d-e0de-4834-a48f-84999e696891	\N	post_published	post	Đăng bài thất bại lên facebook: Cuong Na Van - Không có quyền đăng bài lên trang này. Vui lòng kiểm tra quyền admin.	post	bd567796-ab03-480a-a0aa-5670d2669d04	{}	{}	\N	\N	\N	\N	failed	\N	\N	{"error": "Không có quyền đăng bài lên trang này. Vui lòng kiểm tra quyền admin.", "provider": "facebook", "schedule_id": "a31315d8-ddad-4768-87eb-3f90dd37ef6c", "platform_response": {"error": {"code": 200, "type": "OAuthException", "message": "(#200) If posting to a group, requires app being installed in the group, and \\\\\\n          either publish_to_groups permission with user token, or both pages_read_engagement \\\\\\n          and pages_manage_posts permission with page token; If posting to a page, \\\\\\n          requires both pages_read_engagement and pages_manage_posts as an admin with \\\\\\n          sufficient administrative permission", "fbtrace_id": "AziVv9sn1LFCoxWDhFlPuib"}}, "publish_timestamp": "2025-11-10T17:46:56.545Z", "social_account_id": "4b191ac9-a64c-4241-86f7-f0aff480d1bc"}	2025-11-11 00:46:56.54675+07
49cf25f5-b497-46bc-8052-d685f76bf612	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	b85def93-007f-4222-b26e-7b926382d24f	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	1	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-11 00:57:53.50516+07
44408e9c-fd9e-4707-8045-d6d817b5f370	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	9941b154-79e5-45a7-bbcf-1b51debb7804	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-11 00:57:53.566401+07
53767fbf-19e6-4d87-a29d-349fa23aa374	6b02ec4d-e0de-4834-a48f-84999e696891	\N	post_scheduled	post	Lên lịch đăng bài: "AutopostVN.cloud là ứng dụng đăng bài tự động lên Facebook và Instagram và Zalo." vào 06:05:00 12/11/2025	post	\N	{}	{"title": "AutopostVN.cloud là ứng dụng đăng bài tự động lên Facebook và Instagram và Zalo.", "platforms": ["facebook"], "scheduled_time": "2025-11-12T06:05"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	e260595a-c847-4e3d-a8dc-2d5e19756cb7	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"platforms": ["facebook"], "scheduled_for": "2025-11-12T06:05"}	2025-11-12 06:04:48.98158+07
01181a66-d35b-4148-a068-ccafb96d4475	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	9add04fd-5931-456d-b800-9115aca56851	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-12 06:06:13.205484+07
a5da3c17-0203-4149-a3d0-e551e2ce02ad	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	796bf882-3d13-4154-96eb-3c5676263daa	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-12 06:06:13.273934+07
f82a9f6d-f2ec-4309-8de6-008ca37d2f5f	6b02ec4d-e0de-4834-a48f-84999e696891	\N	post_published	post	Đăng bài thất bại lên facebook: Cuong Na Van - Không có quyền đăng bài lên trang này. Vui lòng kiểm tra quyền admin.	post	bd567796-ab03-480a-a0aa-5670d2669d04	{}	{}	\N	\N	\N	\N	failed	\N	\N	{"error": "Không có quyền đăng bài lên trang này. Vui lòng kiểm tra quyền admin.", "provider": "facebook", "schedule_id": "a31315d8-ddad-4768-87eb-3f90dd37ef6c", "platform_response": {"error": {"code": 200, "type": "OAuthException", "message": "(#200) If posting to a group, requires app being installed in the group, and \\\\\\n          either publish_to_groups permission with user token, or both pages_read_engagement \\\\\\n          and pages_manage_posts permission with page token; If posting to a page, \\\\\\n          requires both pages_read_engagement and pages_manage_posts as an admin with \\\\\\n          sufficient administrative permission", "fbtrace_id": "AkgU0OBzmchPmxGbr32XYhU"}}, "publish_timestamp": "2025-11-11T23:06:14.631Z", "social_account_id": "4b191ac9-a64c-4241-86f7-f0aff480d1bc"}	2025-11-12 06:06:14.63326+07
6fdb74c6-5e32-4dc9-864a-f27a71d44071	6b02ec4d-e0de-4834-a48f-84999e696891	\N	post_published	post	Đăng bài thành công lên facebook_page: SLM - Smart Link Manager	post	ae7ebbdd-2033-478d-a4eb-944443892728	{}	{}	\N	\N	\N	\N	success	\N	\N	{"provider": "facebook_page", "schedule_id": "aa4d41da-a118-4a37-bfa4-77beb81fbda1", "external_post_id": "849430298247182_122111657469059241", "platform_response": {"id": "849430298247182_122111657469059241"}, "publish_timestamp": "2025-11-11T23:06:19.046Z", "social_account_id": "f11a4189-ae2f-498b-a8fa-1e9b06d004a2"}	2025-11-12 06:06:19.048059+07
8727c929-79d7-44aa-8d63-52ceaecc0e7d	6b02ec4d-e0de-4834-a48f-84999e696891	\N	post_published	post	Đăng bài thành công lên facebook_page: Autopostvn	post	ae7ebbdd-2033-478d-a4eb-944443892728	{}	{}	\N	\N	\N	\N	success	\N	\N	{"provider": "facebook_page", "schedule_id": "c15ad94b-d9ad-4ca9-919e-b99a7a14de5a", "external_post_id": "758424104026962_122114094393010117", "platform_response": {"id": "758424104026962_122114094393010117"}, "publish_timestamp": "2025-11-11T23:06:23.633Z", "social_account_id": "f7aa374e-b8cb-4e4f-981c-f591eae0f50d"}	2025-11-12 06:06:23.634454+07
b9cc7d8b-8375-4a31-88af-b28a767522c5	6b02ec4d-e0de-4834-a48f-84999e696891	\N	post_published	post	Đăng bài thành công lên facebook_page: Hangnhatban	post	ae7ebbdd-2033-478d-a4eb-944443892728	{}	{}	\N	\N	\N	\N	success	\N	\N	{"provider": "facebook_page", "schedule_id": "a0ab5ea2-72fb-46f0-b5ea-f9536020aad8", "external_post_id": "2434854103192852_1279890584165025", "platform_response": {"id": "2434854103192852_1279890584165025"}, "publish_timestamp": "2025-11-11T23:06:26.969Z", "social_account_id": "77ffede9-0b55-409c-9ecc-1d4976173a46"}	2025-11-12 06:06:26.971583+07
7be10c49-5cb8-4439-b3c9-980d0076589b	6b02ec4d-e0de-4834-a48f-84999e696891	\N	post_published	post	Đăng bài thành công lên facebook_page: Công cụ hỗ trợ hóa đơn điện tử	post	ae7ebbdd-2033-478d-a4eb-944443892728	{}	{}	\N	\N	\N	\N	success	\N	\N	{"provider": "facebook_page", "schedule_id": "ee4f81f5-1eaf-4da9-9274-8cc58998717d", "external_post_id": "929891000491991_802727509255462", "platform_response": {"id": "929891000491991_802727509255462"}, "publish_timestamp": "2025-11-11T23:06:30.367Z", "social_account_id": "9cde35ff-acf5-4bcd-8afd-864020df698b"}	2025-11-12 06:06:30.36971+07
8889970a-1e39-4eb5-bcf9-f474194e1002	6b02ec4d-e0de-4834-a48f-84999e696891	486fdee4-7b40-453d-bb69-681b9f3f58f8	post_deleted	post	Deleted post: bd567796-ab03-480a-a0aa-5670d2669d04	post	bd567796-ab03-480a-a0aa-5670d2669d04	{}	{}	\N	\N	\N	\N	success	\N	\N	{}	2025-11-12 06:18:37.037645+07
2bf4f4a3-f936-4529-8d79-95d29611a57a	6b02ec4d-e0de-4834-a48f-84999e696891	\N	post_deleted	post	Xóa bài đăng: "Đây là bài test tự động post từ scheduler. Bài này" (facebook_page, facebook)	post	bd567796-ab03-480a-a0aa-5670d2669d04	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	272b2193-4d35-4d2d-b7ea-b9c05e167ed0	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"title": "Đây là bài test tự động post từ scheduler. Bài này", "providers": ["facebook_page", "facebook"], "content_length": 89, "scheduled_time": "2025-11-10T15:14:39.762Z"}	2025-11-12 06:18:37.091853+07
11aba7e3-103c-45fa-8992-a14e40b31428	6b02ec4d-e0de-4834-a48f-84999e696891	486fdee4-7b40-453d-bb69-681b9f3f58f8	post_created	post	Created post: 62d4e193-384e-4374-bfce-7268da7e51ea	post	62d4e193-384e-4374-bfce-7268da7e51ea	{}	{}	\N	\N	\N	\N	success	\N	\N	{}	2025-11-12 07:45:55.77669+07
43e25321-9c02-4028-bd8f-deec8b631b89	6b02ec4d-e0de-4834-a48f-84999e696891	\N	post_created	post	Tạo bài đăng mới: "SLM.io.vn là nền tảng link rút gọn nhanh nhất."	post	\N	{}	{"title": "SLM.io.vn là nền tảng link rút gọn nhanh nhất.", "content": "🚀 BÙM! SLM.io.vn - NỀN TẢNG LINK RÚT GỌN NHANH NHẤT ĐÃ CÓ MẶT! 🚀\\n\\nChào mọi người ơi! 👋\\n\\nBạn có ba...", "metadata": {"cta": "Mua ngay", "type": "social", "ratio": "1:1", "hashtags": "", "platform": "Facebook Page", "brandColor": "#0ea5e9"}, "platforms": ["facebook"]}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	588c4335-3be4-4840-806b-c9ab79902163	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"tab_type": "social", "has_media": true, "platforms": ["facebook"], "is_scheduled": false}	2025-11-12 07:45:57.016887+07
49eb1db1-f490-4d18-8332-510fab5175f0	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	486fdee4-7b40-453d-bb69-681b9f3f58f8	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	1a418241-93d1-4bab-b3fe-2e1ac647cf46	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-12 07:46:17.558204+07
deac0c86-4e56-49ce-8504-cd1646f43527	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	486fdee4-7b40-453d-bb69-681b9f3f58f8	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	ae42ece1-43d2-4fa9-b9e6-7ef0f02deff0	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-12 07:46:17.6647+07
6a593d83-a612-43ad-976b-b970127c6a8a	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	486fdee4-7b40-453d-bb69-681b9f3f58f8	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	b1732d71-3d4f-40bf-ab1c-0c6ae4e4bf3e	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-12 07:47:47.812787+07
4298fb6b-c093-4f69-978d-0904285cae0a	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	486fdee4-7b40-453d-bb69-681b9f3f58f8	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	e192baae-eecd-4b19-beb7-1498e231c7a4	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-12 07:47:47.892761+07
d0b71e55-03ef-43d5-b242-b31bbc4a4272	6b02ec4d-e0de-4834-a48f-84999e696891	486fdee4-7b40-453d-bb69-681b9f3f58f8	post_created	post	Created post: 896d75f0-f8c7-4977-915a-8bb4101d0cc4	post	896d75f0-f8c7-4977-915a-8bb4101d0cc4	{}	{}	\N	\N	\N	\N	success	\N	\N	{}	2025-11-12 07:48:31.363326+07
a6d61251-60a7-4e60-979f-cd58ba3aa09e	6b02ec4d-e0de-4834-a48f-84999e696891	\N	post_scheduled	post	Lên lịch đăng bài: "🚀 BÙM! SLM.io.vn - NỀN TẢNG LINK RÚT GỌN NHANH NHẤT ĐÃ CÓ MẶT! 🚀" vào 07:50:00 12/11/2025	post	\N	{}	{"title": "🚀 BÙM! SLM.io.vn - NỀN TẢNG LINK RÚT GỌN NHANH NHẤT ĐÃ CÓ MẶT! 🚀", "platforms": ["facebook"], "scheduled_time": "2025-11-12T07:50"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	9d46012d-3c06-4cb0-a208-eb66ddbe84c3	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"platforms": ["facebook"], "scheduled_for": "2025-11-12T07:50"}	2025-11-12 07:48:31.422052+07
5e4709bd-f700-465e-90d9-f184d1166319	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	486fdee4-7b40-453d-bb69-681b9f3f58f8	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	af404bf9-b1dd-4944-9e1f-d23394ca3920	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-12 07:48:41.50952+07
99275ac5-75bb-49e2-be5a-d90e3b19aa7c	6b02ec4d-e0de-4834-a48f-84999e696891	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	486fdee4-7b40-453d-bb69-681b9f3f58f8	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	bf43aa4e-54b8-4716-ab08-9adecb7214d0	6b02ec4d-e0de-4834-a48f-84999e696891	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-12 07:48:41.592387+07
d8f4a514-ca61-47f5-b479-cd1002b212cd	6b02ec4d-e0de-4834-a48f-84999e696891	\N	post_published	post	Đăng bài thành công lên facebook_page: SLM - Smart Link Manager	post	896d75f0-f8c7-4977-915a-8bb4101d0cc4	{}	{}	\N	\N	\N	\N	success	\N	\N	{"provider": "facebook_page", "schedule_id": "efd20a44-607a-4b7c-b8cf-d0e486846f45", "external_post_id": "849430298247182_122111666667059241", "platform_response": {"id": "849430298247182_122111666667059241"}, "publish_timestamp": "2025-11-12T00:48:47.300Z", "social_account_id": "f11a4189-ae2f-498b-a8fa-1e9b06d004a2"}	2025-11-12 07:48:47.302139+07
69163307-9bb7-437d-9092-484f8c948658	6b02ec4d-e0de-4834-a48f-84999e696891	\N	post_published	post	Đăng bài thành công lên facebook_page: Autopostvn	post	896d75f0-f8c7-4977-915a-8bb4101d0cc4	{}	{}	\N	\N	\N	\N	success	\N	\N	{"provider": "facebook_page", "schedule_id": "4a0d4a1c-31d5-4a69-b3c7-fa15d53310ae", "external_post_id": "758424104026962_122114098431010117", "platform_response": {"id": "758424104026962_122114098431010117"}, "publish_timestamp": "2025-11-12T00:48:49.553Z", "social_account_id": "f7aa374e-b8cb-4e4f-981c-f591eae0f50d"}	2025-11-12 07:48:49.555843+07
b84078b8-9ba8-4bbf-b38f-3c73e913dfb1	6b02ec4d-e0de-4834-a48f-84999e696891	\N	post_published	post	Đăng bài thành công lên facebook_page: Hangnhatban	post	896d75f0-f8c7-4977-915a-8bb4101d0cc4	{}	{}	\N	\N	\N	\N	success	\N	\N	{"provider": "facebook_page", "schedule_id": "946b38d4-06ef-4599-8240-ab5797b0dc34", "external_post_id": "2434854103192852_1279940207493396", "platform_response": {"id": "2434854103192852_1279940207493396"}, "publish_timestamp": "2025-11-12T00:48:52.560Z", "social_account_id": "77ffede9-0b55-409c-9ecc-1d4976173a46"}	2025-11-12 07:48:52.561937+07
4c0c414f-f7f0-4da5-83dc-7c1de51a4bc2	6b02ec4d-e0de-4834-a48f-84999e696891	\N	post_published	post	Đăng bài thành công lên facebook_page: Công cụ hỗ trợ hóa đơn điện tử	post	896d75f0-f8c7-4977-915a-8bb4101d0cc4	{}	{}	\N	\N	\N	\N	success	\N	\N	{"provider": "facebook_page", "schedule_id": "6448a46e-1784-4596-b8a1-237b519ad908", "external_post_id": "929891000491991_802776155917264", "platform_response": {"id": "929891000491991_802776155917264"}, "publish_timestamp": "2025-11-12T00:48:54.807Z", "social_account_id": "9cde35ff-acf5-4bcd-8afd-864020df698b"}	2025-11-12 07:48:54.808904+07
a4551337-eecc-4043-8f39-586259c93d7c	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	post_failed	post	Lỗi tạo bài đăng: "🔥 BÙNG NỔ CÙNG AUTOPOSTVN - CHÌA KHÓA VÀNG CHO MỌI CHIẾN DỊCH MARKETING! 🔥" - No social accounts found for platforms: facebook_page. Please connect your accounts first.	post	\N	{}	{"title": "🔥 BÙNG NỔ CÙNG AUTOPOSTVN - CHÌA KHÓA VÀNG CHO MỌI CHIẾN DỊCH MARKETING! 🔥", "error_message": "No social accounts found for platforms: facebook_page. Please connect your accounts first."}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	c58c6691-1d97-486e-9f9a-a7edae913df7	cce57fee-a743-4ff6-9c90-e4953f43be26	failed	\N	0	{"platforms": ["facebook"], "error_type": "unknown"}	2025-11-12 08:08:09.201143+07
a9049458-d832-4375-ba94-be241206a191	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	post_failed	post	Lỗi tạo bài đăng: "🔥 BÙNG NỔ CÙNG AUTOPOSTVN - CHÌA KHÓA VÀNG CHO MỌI CHIẾN DỊCH MARKETING! 🔥" - No social accounts found for platforms: facebook_page. Please connect your accounts first.	post	\N	{}	{"title": "🔥 BÙNG NỔ CÙNG AUTOPOSTVN - CHÌA KHÓA VÀNG CHO MỌI CHIẾN DỊCH MARKETING! 🔥", "error_message": "No social accounts found for platforms: facebook_page. Please connect your accounts first."}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	4fe9cdde-0c4a-4d43-a6c2-0acc7858d17e	cce57fee-a743-4ff6-9c90-e4953f43be26	failed	\N	0	{"platforms": ["facebook"], "error_type": "unknown"}	2025-11-12 08:08:31.472321+07
031ebab8-3789-4ba4-b28d-0cf433d2fba9	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	486fdee4-7b40-453d-bb69-681b9f3f58f8	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	a11b261d-0f2d-4401-8926-22e7b0362d6a	cce57fee-a743-4ff6-9c90-e4953f43be26	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-12 08:09:35.163058+07
3cb42f74-e3f7-40b0-afa9-0193989c815e	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	486fdee4-7b40-453d-bb69-681b9f3f58f8	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	bf5f4174-7f8c-4698-90c6-36ada4fff985	cce57fee-a743-4ff6-9c90-e4953f43be26	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-12 08:09:35.225762+07
b94fb925-3c6c-4bc9-bda1-5376d6955248	cce57fee-a743-4ff6-9c90-e4953f43be26	cce57fee-a743-4ff6-9c90-e4953f43be26	post_deleted	post	Deleted post: 12204140-7bf0-4679-9174-4d3e6f410e55	post	12204140-7bf0-4679-9174-4d3e6f410e55	{}	{}	\N	\N	\N	\N	success	\N	\N	{}	2025-11-12 08:09:49.657999+07
be0b9423-e243-47c5-8dae-3f6fe17401d1	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	post_deleted	post	Xóa bài đăng: "🔥 BÙNG NỔ CÙNG AUTOPOSTVN - CHÌA KHÓA VÀNG CHO MỌ"	post	12204140-7bf0-4679-9174-4d3e6f410e55	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	3f740672-624e-4c0d-bc8a-3a58db0dbdec	cce57fee-a743-4ff6-9c90-e4953f43be26	success	\N	0	{"title": "🔥 BÙNG NỔ CÙNG AUTOPOSTVN - CHÌA KHÓA VÀNG CHO MỌ", "providers": [], "content_length": 1381, "scheduled_time": "2025-11-12T01:08:09.131Z"}	2025-11-12 08:09:49.70498+07
9f01b368-12a3-4a49-927e-90647c36be36	cce57fee-a743-4ff6-9c90-e4953f43be26	cce57fee-a743-4ff6-9c90-e4953f43be26	post_deleted	post	Deleted post: e63f0d75-6994-40a1-95d4-85f7957d66d5	post	e63f0d75-6994-40a1-95d4-85f7957d66d5	{}	{}	\N	\N	\N	\N	success	\N	\N	{}	2025-11-12 08:09:54.094405+07
bc6bce37-d967-4836-a04e-9823bef6589b	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	post_deleted	post	Xóa bài đăng: "🔥 BÙNG NỔ CÙNG AUTOPOSTVN - CHÌA KHÓA VÀNG CHO MỌ"	post	e63f0d75-6994-40a1-95d4-85f7957d66d5	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	e172a79b-e611-42d2-b72f-d8e82f2bae18	cce57fee-a743-4ff6-9c90-e4953f43be26	success	\N	0	{"title": "🔥 BÙNG NỔ CÙNG AUTOPOSTVN - CHÌA KHÓA VÀNG CHO MỌ", "providers": [], "content_length": 1381, "scheduled_time": "2025-11-12T01:08:31.371Z"}	2025-11-12 08:09:54.138727+07
9be70499-5b9f-4ed4-bb38-f2c25703f610	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	post_failed	post	Lỗi tạo bài đăng: "Chào cả nhà yêu thích kinh doanh online! 👋" - No social accounts found for platforms: facebook_page. Please connect your accounts first.	post	\N	{}	{"title": "Chào cả nhà yêu thích kinh doanh online! 👋", "error_message": "No social accounts found for platforms: facebook_page. Please connect your accounts first."}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	580363d6-7a94-4c15-af59-129a8bb897d3	cce57fee-a743-4ff6-9c90-e4953f43be26	failed	\N	0	{"platforms": ["facebook"], "error_type": "unknown"}	2025-11-12 08:10:23.3752+07
67fa7bc5-f91b-4652-839e-ff9bfd35cace	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	486fdee4-7b40-453d-bb69-681b9f3f58f8	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	613ec503-b637-4732-a681-cb7bf64f3937	cce57fee-a743-4ff6-9c90-e4953f43be26	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-12 08:20:48.163+07
419f69f1-e1e9-41e3-9b9d-92212d79f4c4	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	486fdee4-7b40-453d-bb69-681b9f3f58f8	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	3d92b177-1e56-4d13-8014-2f39c20874d6	cce57fee-a743-4ff6-9c90-e4953f43be26	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-12 08:20:48.222057+07
d37f3ea2-babe-4c43-a97c-c63abbfef9f6	cce57fee-a743-4ff6-9c90-e4953f43be26	cce57fee-a743-4ff6-9c90-e4953f43be26	post_deleted	post	Deleted post: 563e6c20-04ee-4e31-a024-3b249f9686cc	post	563e6c20-04ee-4e31-a024-3b249f9686cc	{}	{}	\N	\N	\N	\N	success	\N	\N	{}	2025-11-12 08:21:05.686625+07
6aa33fbc-a832-492e-9c4d-2a86d9c68832	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	post_deleted	post	Xóa bài đăng: "🔥 BÙNG NỔ CÙNG AUTOPOSTVN - CHÌA KHÓA VÀNG CHO MỌ"	post	563e6c20-04ee-4e31-a024-3b249f9686cc	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	d459b492-4176-490e-be59-55d7bea16915	cce57fee-a743-4ff6-9c90-e4953f43be26	success	\N	0	{"title": "🔥 BÙNG NỔ CÙNG AUTOPOSTVN - CHÌA KHÓA VÀNG CHO MỌ", "providers": [], "content_length": 1381, "scheduled_time": "2025-11-12T01:10:23.318Z"}	2025-11-12 08:21:05.739577+07
9aa5e48a-0976-4638-8825-b2873f4564c9	cce57fee-a743-4ff6-9c90-e4953f43be26	cce57fee-a743-4ff6-9c90-e4953f43be26	post_created	post	Created post: 7885b2cb-36c5-41a8-b15b-2b006f063aef	post	7885b2cb-36c5-41a8-b15b-2b006f063aef	{}	{}	\N	\N	\N	\N	success	\N	\N	{}	2025-11-12 08:21:24.602555+07
aa6bc645-2bc1-4e9b-ac6c-37869498fe86	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	post_scheduled	post	Lên lịch đăng bài: "BÙNG NỔ CÙNG AUTOPOSTVN - CHÌA KHÓA VÀNG CHO MỌI CHIẾN DỊCH MARKETING! 🔥" vào 08:23:00 12/11/2025	post	\N	{}	{"title": "BÙNG NỔ CÙNG AUTOPOSTVN - CHÌA KHÓA VÀNG CHO MỌI CHIẾN DỊCH MARKETING! 🔥", "platforms": ["facebook"], "scheduled_time": "2025-11-12T08:23"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	cddc9cd7-a4e1-4d44-88a1-706bf609cfb6	cce57fee-a743-4ff6-9c90-e4953f43be26	success	\N	0	{"platforms": ["facebook"], "scheduled_for": "2025-11-12T08:23"}	2025-11-12 08:21:24.657409+07
9933672c-f39d-42ab-b604-0984c6db2777	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	486fdee4-7b40-453d-bb69-681b9f3f58f8	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	5925c98c-aa9b-4fef-a653-defe430b1596	cce57fee-a743-4ff6-9c90-e4953f43be26	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-12 08:23:08.876209+07
eac3930c-6276-49a9-898d-a00fa4becdf2	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	486fdee4-7b40-453d-bb69-681b9f3f58f8	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	7fe39c6b-5070-4ca4-b906-502e8489c27e	cce57fee-a743-4ff6-9c90-e4953f43be26	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-12 08:23:08.943514+07
168fea6d-bb95-46de-b2a4-52cc5ed4927d	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	post_published	post	Đăng bài thành công lên facebook_page: SLM - Smart Link Manager	post	7885b2cb-36c5-41a8-b15b-2b006f063aef	{}	{}	\N	\N	\N	\N	success	\N	\N	{"provider": "facebook_page", "schedule_id": "c08e087a-eff6-4b99-b02e-5bce6f7d6c70", "external_post_id": "849430298247182_122111683071059241", "platform_response": {"id": "849430298247182_122111683071059241"}, "publish_timestamp": "2025-11-12T01:23:12.777Z", "social_account_id": "beeb5cce-906b-4f5d-93cc-a300c39b9482"}	2025-11-12 08:23:12.778929+07
3c7f7e63-30c2-4e28-a74b-944b8309ca65	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	post_published	post	Đăng bài thành công lên facebook_page: Autopostvn	post	7885b2cb-36c5-41a8-b15b-2b006f063aef	{}	{}	\N	\N	\N	\N	success	\N	\N	{"provider": "facebook_page", "schedule_id": "f801d201-d5d1-4754-8a37-67d471e0532d", "external_post_id": "758424104026962_122114100357010117", "platform_response": {"id": "758424104026962_122114100357010117"}, "publish_timestamp": "2025-11-12T01:23:14.924Z", "social_account_id": "9a8f8308-7981-4f86-b560-f18cd44c6e4f"}	2025-11-12 08:23:14.926857+07
9f3d6ca2-1c93-463e-9f3c-1623cb16598c	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	post_published	post	Đăng bài thành công lên facebook_page: Hangnhatban	post	7885b2cb-36c5-41a8-b15b-2b006f063aef	{}	{}	\N	\N	\N	\N	success	\N	\N	{"provider": "facebook_page", "schedule_id": "ed2d1b2f-016a-424a-8b6f-e37bfc390e74", "external_post_id": "2434854103192852_1279958244158259", "platform_response": {"id": "2434854103192852_1279958244158259"}, "publish_timestamp": "2025-11-12T01:23:16.630Z", "social_account_id": "84ed9410-b4f7-454b-81ba-a6d576472bb2"}	2025-11-12 08:23:16.63147+07
4636ba42-0127-4f5f-83d6-d69038e157df	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	post_published	post	Đăng bài thành công lên facebook_page: Công cụ hỗ trợ hóa đơn điện tử	post	7885b2cb-36c5-41a8-b15b-2b006f063aef	{}	{}	\N	\N	\N	\N	success	\N	\N	{"provider": "facebook_page", "schedule_id": "4249b2b5-83b6-429b-bfbe-bab9775bb08c", "external_post_id": "929891000491991_802793785915501", "platform_response": {"id": "929891000491991_802793785915501"}, "publish_timestamp": "2025-11-12T01:23:22.877Z", "social_account_id": "80b362a4-a32a-4a39-a8bd-41057de89c6c"}	2025-11-12 08:23:22.878967+07
8f0a4e30-b3d0-41bd-b275-e15942c7fe5b	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	cce57fee-a743-4ff6-9c90-e4953f43be26	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	4ddbdc2a-3052-41ae-9ba0-38e74ed1db27	cce57fee-a743-4ff6-9c90-e4953f43be26	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-12 08:25:01.270309+07
fcf25442-e36e-452e-a359-3e63420b48ec	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	cce57fee-a743-4ff6-9c90-e4953f43be26	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	69ca04eb-14fe-45c9-9491-6e1a49a6eb4f	cce57fee-a743-4ff6-9c90-e4953f43be26	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-12 08:25:01.33546+07
d5ebcd74-9842-404e-9a83-c0ab9635cd77	cce57fee-a743-4ff6-9c90-e4953f43be26	cce57fee-a743-4ff6-9c90-e4953f43be26	post_created	post	Created post: c65ee78d-4383-4721-ae9b-e1acd835524a	post	c65ee78d-4383-4721-ae9b-e1acd835524a	{}	{}	\N	\N	\N	\N	success	\N	\N	{}	2025-11-12 08:35:06.635163+07
13db9432-af65-4136-a5ef-993998fa6fb9	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	post_scheduled	post	Lên lịch đăng bài: "🚀 BÙM! SLM.io.vn - NỀN TẢNG LINK RÚT GỌN NHANH NHẤT ĐÃ CÓ MẶT! 🚀" vào 08:37:00 12/11/2025	post	\N	{}	{"title": "🚀 BÙM! SLM.io.vn - NỀN TẢNG LINK RÚT GỌN NHANH NHẤT ĐÃ CÓ MẶT! 🚀", "platforms": ["facebook"], "scheduled_time": "2025-11-12T08:37"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	4f73e065-5719-44cb-826c-eff151ef8029	cce57fee-a743-4ff6-9c90-e4953f43be26	success	\N	0	{"platforms": ["facebook"], "scheduled_for": "2025-11-12T08:37"}	2025-11-12 08:35:06.691555+07
a812bc35-30b3-488b-9e0f-21e824d928d0	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	cce57fee-a743-4ff6-9c90-e4953f43be26	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	71eb9ff1-9852-41c7-a053-8c401a119e47	cce57fee-a743-4ff6-9c90-e4953f43be26	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-12 08:35:56.181899+07
15e2cafc-641b-4af3-8f41-9377659abdeb	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	cce57fee-a743-4ff6-9c90-e4953f43be26	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	3a2ccd39-c520-4da5-9c2b-ff7f2c4704d3	cce57fee-a743-4ff6-9c90-e4953f43be26	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-12 08:35:56.254693+07
05a70489-7ca7-4eea-b9b5-46ab546208d9	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	post_published	post	Đăng bài thành công lên facebook_page: SLM - Smart Link Manager	post	c65ee78d-4383-4721-ae9b-e1acd835524a	{}	{}	\N	\N	\N	\N	success	\N	\N	{"provider": "facebook_page", "schedule_id": "85696605-ad35-4512-a334-f42be678447d", "external_post_id": "849430298247182_122111692305059241", "platform_response": {"id": "849430298247182_122111692305059241"}, "publish_timestamp": "2025-11-12T01:36:06.761Z", "social_account_id": "beeb5cce-906b-4f5d-93cc-a300c39b9482"}	2025-11-12 08:36:06.762738+07
461300ae-225f-4cf0-9df2-233977849141	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	post_published	post	Đăng bài thành công lên facebook_page: Autopostvn	post	c65ee78d-4383-4721-ae9b-e1acd835524a	{}	{}	\N	\N	\N	\N	success	\N	\N	{"provider": "facebook_page", "schedule_id": "4920d507-fe53-418a-a01c-2096269e9a44", "external_post_id": "758424104026962_122114101083010117", "platform_response": {"id": "758424104026962_122114101083010117"}, "publish_timestamp": "2025-11-12T01:36:12.181Z", "social_account_id": "9a8f8308-7981-4f86-b560-f18cd44c6e4f"}	2025-11-12 08:36:12.182969+07
a8bd55eb-136d-41be-84da-eed2adfc8a1b	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	post_published	post	Đăng bài thành công lên facebook_page: Hangnhatban	post	c65ee78d-4383-4721-ae9b-e1acd835524a	{}	{}	\N	\N	\N	\N	success	\N	\N	{"provider": "facebook_page", "schedule_id": "a89ef5e6-c156-4729-8576-c33c1259070b", "external_post_id": "2434854103192852_1279964890824261", "platform_response": {"id": "2434854103192852_1279964890824261"}, "publish_timestamp": "2025-11-12T01:36:15.879Z", "social_account_id": "84ed9410-b4f7-454b-81ba-a6d576472bb2"}	2025-11-12 08:36:15.880987+07
d14848f5-715a-4408-8d84-38c5dec9765d	cce57fee-a743-4ff6-9c90-e4953f43be26	\N	post_published	post	Đăng bài thành công lên facebook_page: Công cụ hỗ trợ hóa đơn điện tử	post	c65ee78d-4383-4721-ae9b-e1acd835524a	{}	{}	\N	\N	\N	\N	success	\N	\N	{"provider": "facebook_page", "schedule_id": "2f00ae20-ada3-47a5-8646-bfe38707e3fc", "external_post_id": "929891000491991_802800669248146", "platform_response": {"id": "929891000491991_802800669248146"}, "publish_timestamp": "2025-11-12T01:36:20.438Z", "social_account_id": "80b362a4-a32a-4a39-a8bd-41057de89c6c"}	2025-11-12 08:36:20.439866+07
a995ddb1-72fa-442a-91c6-8487bd7d5e87	3005f34d-5584-4e7c-93eb-7090240caa8f	7a010eea-8e31-40f6-ace5-6c7aa051e9d0	post_created	post	Created post: fb310129-3d4d-4411-8841-70417abde989	post	fb310129-3d4d-4411-8841-70417abde989	{}	{}	\N	\N	\N	\N	success	\N	\N	{}	2025-11-12 08:45:06.797715+07
50f54b97-16a3-4cbb-a7ff-17f91a10d88f	3005f34d-5584-4e7c-93eb-7090240caa8f	\N	post_scheduled	post	Lên lịch đăng bài: "AutopostVN là nền tảng cho doanh nghiệp marketing" vào 08:47:00 12/11/2025	post	\N	{}	{"title": "AutopostVN là nền tảng cho doanh nghiệp marketing", "platforms": ["facebook"], "scheduled_time": "2025-11-12T08:47"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	350b48a7-a745-4696-a7a6-20b20b975d57	3005f34d-5584-4e7c-93eb-7090240caa8f	success	\N	0	{"platforms": ["facebook"], "scheduled_for": "2025-11-12T08:47"}	2025-11-12 08:45:06.850893+07
c4feb128-9b51-4418-a2d2-39fc18a5c467	3005f34d-5584-4e7c-93eb-7090240caa8f	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	7a010eea-8e31-40f6-ace5-6c7aa051e9d0	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	0ace787c-c7f5-4d85-b156-45518125b015	3005f34d-5584-4e7c-93eb-7090240caa8f	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-12 08:46:37.628111+07
9e3b55b8-9129-4e6f-be70-8d77eab0e1d1	3005f34d-5584-4e7c-93eb-7090240caa8f	\N	settings_updated	workspace	Cập nhật cài đặt: 0	workspace	7a010eea-8e31-40f6-ace5-6c7aa051e9d0	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	8de606d1-bba7-455e-8089-485cc9057695	3005f34d-5584-4e7c-93eb-7090240caa8f	success	\N	0	{"changes": ["golden"], "settings_data": {"golden": {"to": ["09:00", "12:30", "20:00"], "from": ["09:00", "12:30", "20:00"]}}}	2025-11-12 08:46:37.671331+07
0926aef2-a261-4c10-8f53-e9f6b7dec090	3005f34d-5584-4e7c-93eb-7090240caa8f	\N	post_validation	post	Kiểm tra bài đăng thành công, sẵn sàng để publish	post	fb310129-3d4d-4411-8841-70417abde989	{}	{}	\N	\N	\N	\N	success	\N	\N	{"errors": [], "warnings": [], "validation_timestamp": "2025-11-12T01:47:21.594Z"}	2025-11-12 08:47:21.595012+07
d670acab-03ef-4b39-9250-8394b523dc85	3005f34d-5584-4e7c-93eb-7090240caa8f	\N	post_published	post	Đăng bài thành công lên facebook_page: SLM - Smart Link Manager	post	fb310129-3d4d-4411-8841-70417abde989	{}	{}	\N	\N	\N	\N	success	\N	\N	{"provider": "facebook_page", "schedule_id": "4cb69a9c-ae7a-461a-8d02-3b8b01ce29aa", "external_post_id": "849430298247182_122111697297059241", "platform_response": {"id": "849430298247182_122111697297059241"}, "publish_timestamp": "2025-11-12T01:47:34.382Z", "social_account_id": "e2472520-cfcc-4f64-9f16-0910c31fba14"}	2025-11-12 08:47:34.384012+07
d35c1ecf-87db-4876-b8fb-fffa9a92df66	3005f34d-5584-4e7c-93eb-7090240caa8f	\N	post_validation	post	Kiểm tra bài đăng thành công, sẵn sàng để publish	post	fb310129-3d4d-4411-8841-70417abde989	{}	{}	\N	\N	\N	\N	success	\N	\N	{"errors": [], "warnings": [], "validation_timestamp": "2025-11-12T01:47:34.409Z"}	2025-11-12 08:47:34.411624+07
81a99eda-ae3c-4f4a-a8ed-c7e3034e2eee	3005f34d-5584-4e7c-93eb-7090240caa8f	\N	post_published	post	Đăng bài thành công lên facebook_page: Autopostvn	post	fb310129-3d4d-4411-8841-70417abde989	{}	{}	\N	\N	\N	\N	success	\N	\N	{"provider": "facebook_page", "schedule_id": "91fe6046-cc3e-43d2-9bd2-0232d497fbc2", "external_post_id": "758424104026962_122114101575010117", "platform_response": {"id": "758424104026962_122114101575010117"}, "publish_timestamp": "2025-11-12T01:47:36.677Z", "social_account_id": "b6017ffc-7b87-4b26-b181-29cc17adc71d"}	2025-11-12 08:47:36.679491+07
6c677512-9167-4ea3-988b-a96eea39b1a9	3005f34d-5584-4e7c-93eb-7090240caa8f	\N	post_validation	post	Kiểm tra bài đăng thành công, sẵn sàng để publish	post	fb310129-3d4d-4411-8841-70417abde989	{}	{}	\N	\N	\N	\N	success	\N	\N	{"errors": [], "warnings": [], "validation_timestamp": "2025-11-12T01:47:36.702Z"}	2025-11-12 08:47:36.703753+07
0559590e-b34a-4e8c-abfa-e8d1090bbadb	3005f34d-5584-4e7c-93eb-7090240caa8f	\N	post_published	post	Đăng bài thành công lên facebook_page: Hangnhatban	post	fb310129-3d4d-4411-8841-70417abde989	{}	{}	\N	\N	\N	\N	success	\N	\N	{"provider": "facebook_page", "schedule_id": "b3054571-3125-4e53-bbf6-baba2ab137da", "external_post_id": "2434854103192852_1279972244156859", "platform_response": {"id": "2434854103192852_1279972244156859"}, "publish_timestamp": "2025-11-12T01:47:39.114Z", "social_account_id": "521b7aa2-0ef0-4f1c-8f6a-054e4c569c54"}	2025-11-12 08:47:39.115939+07
46d011e5-1bd8-4fd5-9ba7-1dd10c3a574d	3005f34d-5584-4e7c-93eb-7090240caa8f	\N	post_validation	post	Kiểm tra bài đăng thành công, sẵn sàng để publish	post	fb310129-3d4d-4411-8841-70417abde989	{}	{}	\N	\N	\N	\N	success	\N	\N	{"errors": [], "warnings": [], "validation_timestamp": "2025-11-12T01:47:39.137Z"}	2025-11-12 08:47:39.13848+07
04fdab42-dc38-4e85-a45d-72dee186c9b4	3005f34d-5584-4e7c-93eb-7090240caa8f	\N	post_published	post	Đăng bài thành công lên facebook_page: Công cụ hỗ trợ hóa đơn điện tử	post	fb310129-3d4d-4411-8841-70417abde989	{}	{}	\N	\N	\N	\N	success	\N	\N	{"provider": "facebook_page", "schedule_id": "066c1284-753c-488e-809b-2e21de06aa9e", "external_post_id": "929891000491991_802806762580870", "platform_response": {"id": "929891000491991_802806762580870"}, "publish_timestamp": "2025-11-12T01:47:43.011Z", "social_account_id": "63c7551a-d894-4bb5-933e-da28ee1dc16d"}	2025-11-12 08:47:43.013057+07
8c2c2ea6-2e31-4382-abe2-6b1c2799f9e6	3005f34d-5584-4e7c-93eb-7090240caa8f	\N	template_used	post	Sử dụng template "Flash Promo" cho bài đăng	template	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	4dd92a23-3d4a-4ba8-ade5-1bb7a284928f	3005f34d-5584-4e7c-93eb-7090240caa8f	success	\N	0	{"template_name": "Flash Promo", "template_type": "social", "template_ratio": "1:1"}	2025-11-12 18:30:51.56013+07
0f842a46-ffe4-4c03-985d-aab231659f6c	3005f34d-5584-4e7c-93eb-7090240caa8f	\N	template_used	post	Sử dụng template "Product Launch" cho bài đăng	template	\N	{}	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	229ef713-a7ae-42f1-8947-012fd94a9db5	3005f34d-5584-4e7c-93eb-7090240caa8f	success	\N	0	{"template_name": "Product Launch", "template_type": "social", "template_ratio": "4:5"}	2025-11-12 18:30:52.284986+07
\.


--
-- TOC entry 5319 (class 0 OID 41269)
-- Dependencies: 237
-- Data for Name: autopostvn_user_profiles; Type: TABLE DATA; Schema: public; Owner: autopost_admin
--

COPY public.autopostvn_user_profiles (id, email, full_name, avatar_url, phone, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5313 (class 0 OID 41078)
-- Dependencies: 230
-- Data for Name: autopostvn_user_social_accounts; Type: TABLE DATA; Schema: public; Owner: autopost_admin
--

COPY public.autopostvn_user_social_accounts (id, user_email, workspace_id, provider, account_name, provider_account_id, access_token, refresh_token, token_expires_at, account_data, status, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5312 (class 0 OID 41064)
-- Dependencies: 229
-- Data for Name: autopostvn_user_workspaces; Type: TABLE DATA; Schema: public; Owner: autopost_admin
--

COPY public.autopostvn_user_workspaces (id, user_email, workspace_name, settings, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5318 (class 0 OID 41251)
-- Dependencies: 236
-- Data for Name: autopostvn_users; Type: TABLE DATA; Schema: public; Owner: autopost_admin
--

COPY public.autopostvn_users (id, email, full_name, avatar_url, user_role, is_active, subscription_expires_at, metadata, created_at, updated_at, phone, password_hash, email_verified, email_verified_at) FROM stdin;
6b02ec4d-e0de-4834-a48f-84999e696891	a@gmail.com	Anh A		free	t	\N	{}	2025-11-09 14:50:13.600993+07	2025-11-09 20:00:33.654952+07	0987939605	$2b$10$f347.BSSrTD2lxDRRQw8ae1QOodmT/I8kLX9DB0QbvPEyrmFU7sCC	f	\N
7531a76e-c7ac-491f-86f5-31ac3f55d650	test@example.com	Test User	\N	free	t	\N	{}	2025-11-11 00:46:36.071+07	2025-11-12 08:06:12.344+07	\N	$2b$10$CCBwNvdl2BfAsLzw/AZzxOQLZ/RL19JGPY93XFYQ3ZXc3.4HFT9EW	f	\N
04f897ff-4f32-47e2-8da2-6069fa29adfe	b@gmail.com	Van B	\N	free	t	\N	{}	2025-11-12 08:01:39.161+07	2025-11-12 08:06:12.351+07	\N	$2b$10$iYfo9Et2tJRFSTZwwL5FkO090E3R2ZCsjRBuTa.p/1BfHQOqyTFqy	f	\N
cce57fee-a743-4ff6-9c90-e4953f43be26	c@gmail.com	Van C	\N	free	t	\N	{}	2025-11-12 08:03:32.117+07	2025-11-12 08:07:02.448136+07	\N	$2b$10$zzFdUfl0w.76.EA4NRNI6uxc9yF5YgJRjThKf65tOYOeg6Gxmz.9G	f	\N
3005f34d-5584-4e7c-93eb-7090240caa8f	d@gmail.com	Van D	\N	free	t	\N	{}	2025-11-12 08:43:15.427+07	2025-11-12 08:43:15.427+07	\N	$2b$10$DwAGXDH7GHuTwyxrdpsmX.0qOOQBoktBL8Qyjj0ipC5Xn0f9GGVny	f	\N
\.


--
-- TOC entry 5311 (class 0 OID 41025)
-- Dependencies: 228
-- Data for Name: autopostvn_webhooks; Type: TABLE DATA; Schema: public; Owner: autopost_admin
--

COPY public.autopostvn_webhooks (id, workspace_id, url, events, secret, is_active, last_triggered_at, created_at) FROM stdin;
\.


--
-- TOC entry 5302 (class 0 OID 40841)
-- Dependencies: 219
-- Data for Name: autopostvn_workspaces; Type: TABLE DATA; Schema: public; Owner: autopost_admin
--

COPY public.autopostvn_workspaces (id, name, slug, description, settings, created_at, updated_at, user_id) FROM stdin;
123e4567-e89b-12d3-a456-426614174000	AutoPost VN Demo	autopost-vn-demo	Demo workspace for AutoPost VN application	{"advanced": {"testMode": false, "autoDeleteDays": 30, "autoDeleteOldPosts": false}, "scheduling": {"timezone": "Asia/Ho_Chi_Minh", "rateLimit": 10, "goldenHours": ["09:00", "12:30", "20:00"]}, "notifications": {"onFailure": true, "onSuccess": true, "onTokenExpiry": true}}	2025-11-09 14:28:03.571641+07	2025-11-09 14:29:26.191561+07	\N
6ee4e9eb-337c-49c7-8b13-3d34209291fd	test@autopostvn.com's Workspace	test-autopostvn-com	Personal workspace for test@autopostvn.com	{}	2025-11-09 14:42:08.047069+07	2025-11-09 14:42:08.047069+07	\N
716ba789-db0e-4cac-a988-c1870c3d435a	a@gmail.com's Workspace	a-gmail-com	Personal workspace for a@gmail.com	{}	2025-11-09 15:01:31.063124+07	2025-11-09 15:01:31.063124+07	\N
7531a76e-c7ac-491f-86f5-31ac3f55d650	Test User's Workspace	test	Workspace mặc định	{}	2025-11-11 00:46:36.073235+07	2025-11-12 08:06:12.332476+07	7531a76e-c7ac-491f-86f5-31ac3f55d650
04f897ff-4f32-47e2-8da2-6069fa29adfe	Van B's Workspace	b	Workspace mặc định	{}	2025-11-12 08:01:39.162801+07	2025-11-12 08:06:12.332476+07	04f897ff-4f32-47e2-8da2-6069fa29adfe
df7df996-1bc1-4b7d-95c4-14847aa91920	c@gmail.com's Workspace	user-cce57fee-a743-4ff6-9c90-e4953f43be26	Personal workspace for c@gmail.com	{"user_id": "cce57fee-a743-4ff6-9c90-e4953f43be26", "user_email": "c@gmail.com"}	2025-11-12 08:07:32.265839+07	2025-11-12 08:07:32.265839+07	\N
7a010eea-8e31-40f6-ace5-6c7aa051e9d0	Van D's Workspace	d	Workspace mặc định	{"advanced": {"testMode": false, "autoDeleteDays": 30, "autoDeleteOldPosts": false}, "scheduling": {"timezone": "Asia/Ho_Chi_Minh", "rateLimit": 10, "goldenHours": ["09:00", "12:30", "20:00"]}, "notifications": {"onFailure": true, "onSuccess": true, "onTokenExpiry": true}}	2025-11-12 08:43:15.432+07	2025-11-12 08:46:36.235667+07	3005f34d-5584-4e7c-93eb-7090240caa8f
486fdee4-7b40-453d-bb69-681b9f3f58f8	Anh A's Workspace	user-6b02ec4d-e0de-4834-a48f-84999e696891	Workspace mặc định	{"advanced": {"testMode": false, "autoDeleteDays": 30, "autoDeleteOldPosts": false}, "scheduling": {"timezone": "Asia/Ho_Chi_Minh", "rateLimit": 10, "goldenHours": ["09:00", "12:30", "20:00"]}, "notifications": {"onFailure": true, "onSuccess": true, "onTokenExpiry": true}}	2025-11-09 14:50:13.600993+07	2025-11-12 07:48:41.416125+07	6b02ec4d-e0de-4834-a48f-84999e696891
cce57fee-a743-4ff6-9c90-e4953f43be26	Van C's Workspace	c	Workspace mặc định	{"advanced": {"testMode": false, "autoDeleteDays": 30, "autoDeleteOldPosts": false}, "scheduling": {"timezone": "Asia/Ho_Chi_Minh", "rateLimit": 10, "goldenHours": ["09:00", "12:30", "20:00"]}, "notifications": {"onFailure": true, "onSuccess": true, "onTokenExpiry": true}}	2025-11-12 08:03:32.118591+07	2025-11-12 08:35:56.08158+07	cce57fee-a743-4ff6-9c90-e4953f43be26
\.


--
-- TOC entry 5029 (class 2606 OID 40999)
-- Name: autopostvn_account_performance autopostvn_account_performance_pkey; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_account_performance
    ADD CONSTRAINT autopostvn_account_performance_pkey PRIMARY KEY (id);


--
-- TOC entry 5031 (class 2606 OID 41001)
-- Name: autopostvn_account_performance autopostvn_account_performance_social_account_id_date_key; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_account_performance
    ADD CONSTRAINT autopostvn_account_performance_social_account_id_date_key UNIQUE (social_account_id, date);


--
-- TOC entry 5058 (class 2606 OID 41170)
-- Name: autopostvn_ai_rate_limits autopostvn_ai_rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_ai_rate_limits
    ADD CONSTRAINT autopostvn_ai_rate_limits_pkey PRIMARY KEY (id);


--
-- TOC entry 5060 (class 2606 OID 41172)
-- Name: autopostvn_ai_rate_limits autopostvn_ai_rate_limits_user_role_key; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_ai_rate_limits
    ADD CONSTRAINT autopostvn_ai_rate_limits_user_role_key UNIQUE (user_role);


--
-- TOC entry 5093 (class 2606 OID 41320)
-- Name: autopostvn_ai_usage autopostvn_ai_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_ai_usage
    ADD CONSTRAINT autopostvn_ai_usage_pkey PRIMARY KEY (id);


--
-- TOC entry 5022 (class 2606 OID 40944)
-- Name: autopostvn_analytics_events autopostvn_analytics_events_pkey; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_analytics_events
    ADD CONSTRAINT autopostvn_analytics_events_pkey PRIMARY KEY (id);


--
-- TOC entry 5033 (class 2606 OID 41019)
-- Name: autopostvn_api_keys autopostvn_api_keys_key_hash_key; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_api_keys
    ADD CONSTRAINT autopostvn_api_keys_key_hash_key UNIQUE (key_hash);


--
-- TOC entry 5035 (class 2606 OID 41017)
-- Name: autopostvn_api_keys autopostvn_api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_api_keys
    ADD CONSTRAINT autopostvn_api_keys_pkey PRIMARY KEY (id);


--
-- TOC entry 5026 (class 2606 OID 40969)
-- Name: autopostvn_error_logs autopostvn_error_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_error_logs
    ADD CONSTRAINT autopostvn_error_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5066 (class 2606 OID 41240)
-- Name: autopostvn_media autopostvn_media_pkey; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_media
    ADD CONSTRAINT autopostvn_media_pkey PRIMARY KEY (id);


--
-- TOC entry 5052 (class 2606 OID 41123)
-- Name: autopostvn_oauth_sessions autopostvn_oauth_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_oauth_sessions
    ADD CONSTRAINT autopostvn_oauth_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 5054 (class 2606 OID 41125)
-- Name: autopostvn_oauth_sessions autopostvn_oauth_sessions_state_token_key; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_oauth_sessions
    ADD CONSTRAINT autopostvn_oauth_sessions_state_token_key UNIQUE (state_token);


--
-- TOC entry 5020 (class 2606 OID 40930)
-- Name: autopostvn_post_analytics autopostvn_post_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_post_analytics
    ADD CONSTRAINT autopostvn_post_analytics_pkey PRIMARY KEY (id);


--
-- TOC entry 5062 (class 2606 OID 41197)
-- Name: autopostvn_post_rate_limits autopostvn_post_rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_post_rate_limits
    ADD CONSTRAINT autopostvn_post_rate_limits_pkey PRIMARY KEY (id);


--
-- TOC entry 5064 (class 2606 OID 41199)
-- Name: autopostvn_post_rate_limits autopostvn_post_rate_limits_user_role_key; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_post_rate_limits
    ADD CONSTRAINT autopostvn_post_rate_limits_user_role_key UNIQUE (user_role);


--
-- TOC entry 5016 (class 2606 OID 40910)
-- Name: autopostvn_post_schedules autopostvn_post_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_post_schedules
    ADD CONSTRAINT autopostvn_post_schedules_pkey PRIMARY KEY (id);


--
-- TOC entry 5095 (class 2606 OID 41339)
-- Name: autopostvn_post_usage autopostvn_post_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_post_usage
    ADD CONSTRAINT autopostvn_post_usage_pkey PRIMARY KEY (id);


--
-- TOC entry 5010 (class 2606 OID 40891)
-- Name: autopostvn_posts autopostvn_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_posts
    ADD CONSTRAINT autopostvn_posts_pkey PRIMARY KEY (id);


--
-- TOC entry 5005 (class 2606 OID 40868)
-- Name: autopostvn_social_accounts autopostvn_social_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_social_accounts
    ADD CONSTRAINT autopostvn_social_accounts_pkey PRIMARY KEY (id);


--
-- TOC entry 5007 (class 2606 OID 40870)
-- Name: autopostvn_social_accounts autopostvn_social_accounts_workspace_id_provider_provider_i_key; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_social_accounts
    ADD CONSTRAINT autopostvn_social_accounts_workspace_id_provider_provider_i_key UNIQUE (workspace_id, provider, provider_id);


--
-- TOC entry 5084 (class 2606 OID 41294)
-- Name: autopostvn_system_activity_logs autopostvn_system_activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_system_activity_logs
    ADD CONSTRAINT autopostvn_system_activity_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5080 (class 2606 OID 41279)
-- Name: autopostvn_user_profiles autopostvn_user_profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_user_profiles
    ADD CONSTRAINT autopostvn_user_profiles_email_key UNIQUE (email);


--
-- TOC entry 5082 (class 2606 OID 41277)
-- Name: autopostvn_user_profiles autopostvn_user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_user_profiles
    ADD CONSTRAINT autopostvn_user_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 5044 (class 2606 OID 41093)
-- Name: autopostvn_user_social_accounts autopostvn_user_social_accoun_user_email_provider_provider__key; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_user_social_accounts
    ADD CONSTRAINT autopostvn_user_social_accoun_user_email_provider_provider__key UNIQUE (user_email, provider, provider_account_id);


--
-- TOC entry 5046 (class 2606 OID 41091)
-- Name: autopostvn_user_social_accounts autopostvn_user_social_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_user_social_accounts
    ADD CONSTRAINT autopostvn_user_social_accounts_pkey PRIMARY KEY (id);


--
-- TOC entry 5039 (class 2606 OID 41074)
-- Name: autopostvn_user_workspaces autopostvn_user_workspaces_pkey; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_user_workspaces
    ADD CONSTRAINT autopostvn_user_workspaces_pkey PRIMARY KEY (id);


--
-- TOC entry 5041 (class 2606 OID 41076)
-- Name: autopostvn_user_workspaces autopostvn_user_workspaces_user_email_key; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_user_workspaces
    ADD CONSTRAINT autopostvn_user_workspaces_user_email_key UNIQUE (user_email);


--
-- TOC entry 5073 (class 2606 OID 41265)
-- Name: autopostvn_users autopostvn_users_email_key; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_users
    ADD CONSTRAINT autopostvn_users_email_key UNIQUE (email);


--
-- TOC entry 5075 (class 2606 OID 41263)
-- Name: autopostvn_users autopostvn_users_pkey; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_users
    ADD CONSTRAINT autopostvn_users_pkey PRIMARY KEY (id);


--
-- TOC entry 5037 (class 2606 OID 41034)
-- Name: autopostvn_webhooks autopostvn_webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_webhooks
    ADD CONSTRAINT autopostvn_webhooks_pkey PRIMARY KEY (id);


--
-- TOC entry 5000 (class 2606 OID 40851)
-- Name: autopostvn_workspaces autopostvn_workspaces_pkey; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_workspaces
    ADD CONSTRAINT autopostvn_workspaces_pkey PRIMARY KEY (id);


--
-- TOC entry 5002 (class 2606 OID 40853)
-- Name: autopostvn_workspaces autopostvn_workspaces_slug_key; Type: CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_workspaces
    ADD CONSTRAINT autopostvn_workspaces_slug_key UNIQUE (slug);


--
-- TOC entry 5085 (class 1259 OID 41302)
-- Name: idx_autopostvn_activity_logs_action_category; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_autopostvn_activity_logs_action_category ON public.autopostvn_system_activity_logs USING btree (action_category, created_at DESC);


--
-- TOC entry 5086 (class 1259 OID 41303)
-- Name: idx_autopostvn_activity_logs_action_type; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_autopostvn_activity_logs_action_type ON public.autopostvn_system_activity_logs USING btree (action_type, created_at DESC);


--
-- TOC entry 5087 (class 1259 OID 41306)
-- Name: idx_autopostvn_activity_logs_created_at; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_autopostvn_activity_logs_created_at ON public.autopostvn_system_activity_logs USING btree (created_at DESC);


--
-- TOC entry 5088 (class 1259 OID 41305)
-- Name: idx_autopostvn_activity_logs_status; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_autopostvn_activity_logs_status ON public.autopostvn_system_activity_logs USING btree (status, created_at DESC);


--
-- TOC entry 5089 (class 1259 OID 41304)
-- Name: idx_autopostvn_activity_logs_target_resource; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_autopostvn_activity_logs_target_resource ON public.autopostvn_system_activity_logs USING btree (target_resource_type, target_resource_id);


--
-- TOC entry 5090 (class 1259 OID 41300)
-- Name: idx_autopostvn_activity_logs_user_id; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_autopostvn_activity_logs_user_id ON public.autopostvn_system_activity_logs USING btree (user_id, created_at DESC);


--
-- TOC entry 5091 (class 1259 OID 41301)
-- Name: idx_autopostvn_activity_logs_workspace_id; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_autopostvn_activity_logs_workspace_id ON public.autopostvn_system_activity_logs USING btree (workspace_id, created_at DESC);


--
-- TOC entry 5023 (class 1259 OID 41046)
-- Name: idx_autopostvn_analytics_events_created_at; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_autopostvn_analytics_events_created_at ON public.autopostvn_analytics_events USING btree (created_at);


--
-- TOC entry 5024 (class 1259 OID 41045)
-- Name: idx_autopostvn_analytics_events_workspace_type; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_autopostvn_analytics_events_workspace_type ON public.autopostvn_analytics_events USING btree (workspace_id, event_type);


--
-- TOC entry 5027 (class 1259 OID 41047)
-- Name: idx_autopostvn_error_logs_workspace_unresolved; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_autopostvn_error_logs_workspace_unresolved ON public.autopostvn_error_logs USING btree (workspace_id) WHERE (resolved_at IS NULL);


--
-- TOC entry 5017 (class 1259 OID 41043)
-- Name: idx_autopostvn_post_schedules_account; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_autopostvn_post_schedules_account ON public.autopostvn_post_schedules USING btree (social_account_id, status);


--
-- TOC entry 5018 (class 1259 OID 41042)
-- Name: idx_autopostvn_post_schedules_pending; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_autopostvn_post_schedules_pending ON public.autopostvn_post_schedules USING btree (scheduled_at) WHERE (status = 'pending'::text);


--
-- TOC entry 5011 (class 1259 OID 41249)
-- Name: idx_autopostvn_posts_media_type; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_autopostvn_posts_media_type ON public.autopostvn_posts USING btree (media_type);


--
-- TOC entry 5012 (class 1259 OID 41041)
-- Name: idx_autopostvn_posts_scheduled_at; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_autopostvn_posts_scheduled_at ON public.autopostvn_posts USING btree (scheduled_at) WHERE (status = 'scheduled'::text);


--
-- TOC entry 5013 (class 1259 OID 41040)
-- Name: idx_autopostvn_posts_workspace_status; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_autopostvn_posts_workspace_status ON public.autopostvn_posts USING btree (workspace_id, status);


--
-- TOC entry 5008 (class 1259 OID 41044)
-- Name: idx_autopostvn_social_accounts_workspace; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_autopostvn_social_accounts_workspace ON public.autopostvn_social_accounts USING btree (workspace_id, status);


--
-- TOC entry 5076 (class 1259 OID 41347)
-- Name: idx_autopostvn_users_email_verified; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_autopostvn_users_email_verified ON public.autopostvn_users USING btree (email, email_verified);


--
-- TOC entry 5077 (class 1259 OID 41266)
-- Name: idx_autopostvn_users_phone; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_autopostvn_users_phone ON public.autopostvn_users USING btree (phone);


--
-- TOC entry 5078 (class 1259 OID 41267)
-- Name: idx_autopostvn_users_user_role; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_autopostvn_users_user_role ON public.autopostvn_users USING btree (user_role);


--
-- TOC entry 5067 (class 1259 OID 41242)
-- Name: idx_media_lifecycle; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_media_lifecycle ON public.autopostvn_media USING btree (status, published_at, archived_at);


--
-- TOC entry 5068 (class 1259 OID 41245)
-- Name: idx_media_tags; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_media_tags ON public.autopostvn_media USING gin (tags);


--
-- TOC entry 5069 (class 1259 OID 41243)
-- Name: idx_media_type_status; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_media_type_status ON public.autopostvn_media USING btree (media_type, status);


--
-- TOC entry 5070 (class 1259 OID 41241)
-- Name: idx_media_user_status; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_media_user_status ON public.autopostvn_media USING btree (user_id, status, created_at DESC);


--
-- TOC entry 5071 (class 1259 OID 41244)
-- Name: idx_media_workspace; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_media_workspace ON public.autopostvn_media USING btree (workspace_id, status, created_at DESC);


--
-- TOC entry 5055 (class 1259 OID 41127)
-- Name: idx_oauth_sessions_expires; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_oauth_sessions_expires ON public.autopostvn_oauth_sessions USING btree (expires_at);


--
-- TOC entry 5056 (class 1259 OID 41126)
-- Name: idx_oauth_sessions_state; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_oauth_sessions_state ON public.autopostvn_oauth_sessions USING btree (state_token);


--
-- TOC entry 5014 (class 1259 OID 41108)
-- Name: idx_posts_account_id; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_posts_account_id ON public.autopostvn_posts USING btree (account_id);


--
-- TOC entry 5047 (class 1259 OID 41099)
-- Name: idx_user_social_accounts_email; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_user_social_accounts_email ON public.autopostvn_user_social_accounts USING btree (user_email);


--
-- TOC entry 5048 (class 1259 OID 41101)
-- Name: idx_user_social_accounts_provider; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_user_social_accounts_provider ON public.autopostvn_user_social_accounts USING btree (provider);


--
-- TOC entry 5049 (class 1259 OID 41102)
-- Name: idx_user_social_accounts_status; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_user_social_accounts_status ON public.autopostvn_user_social_accounts USING btree (status);


--
-- TOC entry 5050 (class 1259 OID 41100)
-- Name: idx_user_social_accounts_workspace; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_user_social_accounts_workspace ON public.autopostvn_user_social_accounts USING btree (workspace_id);


--
-- TOC entry 5042 (class 1259 OID 41077)
-- Name: idx_user_workspaces_email; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_user_workspaces_email ON public.autopostvn_user_workspaces USING btree (user_email);


--
-- TOC entry 5003 (class 1259 OID 41355)
-- Name: idx_workspaces_user_id; Type: INDEX; Schema: public; Owner: autopost_admin
--

CREATE INDEX idx_workspaces_user_id ON public.autopostvn_workspaces USING btree (user_id);


--
-- TOC entry 5122 (class 2620 OID 41173)
-- Name: autopostvn_ai_rate_limits update_autopostvn_ai_rate_limits_updated_at; Type: TRIGGER; Schema: public; Owner: autopost_admin
--

CREATE TRIGGER update_autopostvn_ai_rate_limits_updated_at BEFORE UPDATE ON public.autopostvn_ai_rate_limits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5126 (class 2620 OID 41326)
-- Name: autopostvn_ai_usage update_autopostvn_ai_usage_updated_at; Type: TRIGGER; Schema: public; Owner: autopost_admin
--

CREATE TRIGGER update_autopostvn_ai_usage_updated_at BEFORE UPDATE ON public.autopostvn_ai_usage FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5124 (class 2620 OID 41246)
-- Name: autopostvn_media update_autopostvn_media_updated_at; Type: TRIGGER; Schema: public; Owner: autopost_admin
--

CREATE TRIGGER update_autopostvn_media_updated_at BEFORE UPDATE ON public.autopostvn_media FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5123 (class 2620 OID 41200)
-- Name: autopostvn_post_rate_limits update_autopostvn_post_rate_limits_updated_at; Type: TRIGGER; Schema: public; Owner: autopost_admin
--

CREATE TRIGGER update_autopostvn_post_rate_limits_updated_at BEFORE UPDATE ON public.autopostvn_post_rate_limits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5119 (class 2620 OID 41062)
-- Name: autopostvn_post_schedules update_autopostvn_post_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: autopost_admin
--

CREATE TRIGGER update_autopostvn_post_schedules_updated_at BEFORE UPDATE ON public.autopostvn_post_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5118 (class 2620 OID 41061)
-- Name: autopostvn_posts update_autopostvn_posts_updated_at; Type: TRIGGER; Schema: public; Owner: autopost_admin
--

CREATE TRIGGER update_autopostvn_posts_updated_at BEFORE UPDATE ON public.autopostvn_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5117 (class 2620 OID 41060)
-- Name: autopostvn_social_accounts update_autopostvn_social_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: autopost_admin
--

CREATE TRIGGER update_autopostvn_social_accounts_updated_at BEFORE UPDATE ON public.autopostvn_social_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5125 (class 2620 OID 41268)
-- Name: autopostvn_users update_autopostvn_users_updated_at; Type: TRIGGER; Schema: public; Owner: autopost_admin
--

CREATE TRIGGER update_autopostvn_users_updated_at BEFORE UPDATE ON public.autopostvn_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5116 (class 2620 OID 41059)
-- Name: autopostvn_workspaces update_autopostvn_workspaces_updated_at; Type: TRIGGER; Schema: public; Owner: autopost_admin
--

CREATE TRIGGER update_autopostvn_workspaces_updated_at BEFORE UPDATE ON public.autopostvn_workspaces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5121 (class 2620 OID 41130)
-- Name: autopostvn_user_social_accounts update_user_social_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: autopost_admin
--

CREATE TRIGGER update_user_social_accounts_updated_at BEFORE UPDATE ON public.autopostvn_user_social_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5120 (class 2620 OID 41129)
-- Name: autopostvn_user_workspaces update_user_workspaces_updated_at; Type: TRIGGER; Schema: public; Owner: autopost_admin
--

CREATE TRIGGER update_user_workspaces_updated_at BEFORE UPDATE ON public.autopostvn_user_workspaces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5109 (class 2606 OID 41002)
-- Name: autopostvn_account_performance autopostvn_account_performance_social_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_account_performance
    ADD CONSTRAINT autopostvn_account_performance_social_account_id_fkey FOREIGN KEY (social_account_id) REFERENCES public.autopostvn_social_accounts(id) ON DELETE CASCADE;


--
-- TOC entry 5114 (class 2606 OID 41321)
-- Name: autopostvn_ai_usage autopostvn_ai_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_ai_usage
    ADD CONSTRAINT autopostvn_ai_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.autopostvn_users(id) ON DELETE CASCADE;


--
-- TOC entry 5103 (class 2606 OID 40950)
-- Name: autopostvn_analytics_events autopostvn_analytics_events_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_analytics_events
    ADD CONSTRAINT autopostvn_analytics_events_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.autopostvn_posts(id) ON DELETE CASCADE;


--
-- TOC entry 5104 (class 2606 OID 40955)
-- Name: autopostvn_analytics_events autopostvn_analytics_events_social_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_analytics_events
    ADD CONSTRAINT autopostvn_analytics_events_social_account_id_fkey FOREIGN KEY (social_account_id) REFERENCES public.autopostvn_social_accounts(id) ON DELETE CASCADE;


--
-- TOC entry 5105 (class 2606 OID 40945)
-- Name: autopostvn_analytics_events autopostvn_analytics_events_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_analytics_events
    ADD CONSTRAINT autopostvn_analytics_events_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.autopostvn_workspaces(id) ON DELETE CASCADE;


--
-- TOC entry 5110 (class 2606 OID 41020)
-- Name: autopostvn_api_keys autopostvn_api_keys_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_api_keys
    ADD CONSTRAINT autopostvn_api_keys_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.autopostvn_workspaces(id) ON DELETE CASCADE;


--
-- TOC entry 5106 (class 2606 OID 40975)
-- Name: autopostvn_error_logs autopostvn_error_logs_post_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_error_logs
    ADD CONSTRAINT autopostvn_error_logs_post_schedule_id_fkey FOREIGN KEY (post_schedule_id) REFERENCES public.autopostvn_post_schedules(id) ON DELETE SET NULL;


--
-- TOC entry 5107 (class 2606 OID 40980)
-- Name: autopostvn_error_logs autopostvn_error_logs_social_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_error_logs
    ADD CONSTRAINT autopostvn_error_logs_social_account_id_fkey FOREIGN KEY (social_account_id) REFERENCES public.autopostvn_social_accounts(id) ON DELETE SET NULL;


--
-- TOC entry 5108 (class 2606 OID 40970)
-- Name: autopostvn_error_logs autopostvn_error_logs_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_error_logs
    ADD CONSTRAINT autopostvn_error_logs_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.autopostvn_workspaces(id) ON DELETE SET NULL;


--
-- TOC entry 5102 (class 2606 OID 40931)
-- Name: autopostvn_post_analytics autopostvn_post_analytics_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_post_analytics
    ADD CONSTRAINT autopostvn_post_analytics_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.autopostvn_posts(id) ON DELETE CASCADE;


--
-- TOC entry 5100 (class 2606 OID 40911)
-- Name: autopostvn_post_schedules autopostvn_post_schedules_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_post_schedules
    ADD CONSTRAINT autopostvn_post_schedules_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.autopostvn_posts(id) ON DELETE CASCADE;


--
-- TOC entry 5101 (class 2606 OID 40916)
-- Name: autopostvn_post_schedules autopostvn_post_schedules_social_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_post_schedules
    ADD CONSTRAINT autopostvn_post_schedules_social_account_id_fkey FOREIGN KEY (social_account_id) REFERENCES public.autopostvn_social_accounts(id) ON DELETE CASCADE;


--
-- TOC entry 5115 (class 2606 OID 41340)
-- Name: autopostvn_post_usage autopostvn_post_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_post_usage
    ADD CONSTRAINT autopostvn_post_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.autopostvn_users(id) ON DELETE CASCADE;


--
-- TOC entry 5098 (class 2606 OID 41103)
-- Name: autopostvn_posts autopostvn_posts_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_posts
    ADD CONSTRAINT autopostvn_posts_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.autopostvn_user_social_accounts(id) ON DELETE CASCADE;


--
-- TOC entry 5099 (class 2606 OID 40892)
-- Name: autopostvn_posts autopostvn_posts_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_posts
    ADD CONSTRAINT autopostvn_posts_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.autopostvn_workspaces(id) ON DELETE CASCADE;


--
-- TOC entry 5097 (class 2606 OID 40871)
-- Name: autopostvn_social_accounts autopostvn_social_accounts_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_social_accounts
    ADD CONSTRAINT autopostvn_social_accounts_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.autopostvn_workspaces(id) ON DELETE CASCADE;


--
-- TOC entry 5113 (class 2606 OID 41295)
-- Name: autopostvn_system_activity_logs autopostvn_system_activity_logs_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_system_activity_logs
    ADD CONSTRAINT autopostvn_system_activity_logs_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.autopostvn_workspaces(id) ON DELETE CASCADE;


--
-- TOC entry 5112 (class 2606 OID 41094)
-- Name: autopostvn_user_social_accounts autopostvn_user_social_accounts_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_user_social_accounts
    ADD CONSTRAINT autopostvn_user_social_accounts_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.autopostvn_user_workspaces(id) ON DELETE CASCADE;


--
-- TOC entry 5111 (class 2606 OID 41035)
-- Name: autopostvn_webhooks autopostvn_webhooks_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_webhooks
    ADD CONSTRAINT autopostvn_webhooks_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.autopostvn_workspaces(id) ON DELETE CASCADE;


--
-- TOC entry 5096 (class 2606 OID 41350)
-- Name: autopostvn_workspaces autopostvn_workspaces_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: autopost_admin
--

ALTER TABLE ONLY public.autopostvn_workspaces
    ADD CONSTRAINT autopostvn_workspaces_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.autopostvn_users(id) ON DELETE CASCADE;


--
-- TOC entry 5280 (class 0 OID 40985)
-- Dependencies: 226
-- Name: autopostvn_account_performance; Type: ROW SECURITY; Schema: public; Owner: autopost_admin
--

ALTER TABLE public.autopostvn_account_performance ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5286 (class 0 OID 41163)
-- Dependencies: 233
-- Name: autopostvn_ai_rate_limits; Type: ROW SECURITY; Schema: public; Owner: autopost_admin
--

ALTER TABLE public.autopostvn_ai_rate_limits ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5278 (class 0 OID 40936)
-- Dependencies: 224
-- Name: autopostvn_analytics_events; Type: ROW SECURITY; Schema: public; Owner: autopost_admin
--

ALTER TABLE public.autopostvn_analytics_events ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5281 (class 0 OID 41007)
-- Dependencies: 227
-- Name: autopostvn_api_keys; Type: ROW SECURITY; Schema: public; Owner: autopost_admin
--

ALTER TABLE public.autopostvn_api_keys ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5279 (class 0 OID 40960)
-- Dependencies: 225
-- Name: autopostvn_error_logs; Type: ROW SECURITY; Schema: public; Owner: autopost_admin
--

ALTER TABLE public.autopostvn_error_logs ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5288 (class 0 OID 41222)
-- Dependencies: 235
-- Name: autopostvn_media; Type: ROW SECURITY; Schema: public; Owner: autopost_admin
--

ALTER TABLE public.autopostvn_media ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5285 (class 0 OID 41114)
-- Dependencies: 232
-- Name: autopostvn_oauth_sessions; Type: ROW SECURITY; Schema: public; Owner: autopost_admin
--

ALTER TABLE public.autopostvn_oauth_sessions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5277 (class 0 OID 40921)
-- Dependencies: 223
-- Name: autopostvn_post_analytics; Type: ROW SECURITY; Schema: public; Owner: autopost_admin
--

ALTER TABLE public.autopostvn_post_analytics ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5287 (class 0 OID 41189)
-- Dependencies: 234
-- Name: autopostvn_post_rate_limits; Type: ROW SECURITY; Schema: public; Owner: autopost_admin
--

ALTER TABLE public.autopostvn_post_rate_limits ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5276 (class 0 OID 40897)
-- Dependencies: 222
-- Name: autopostvn_post_schedules; Type: ROW SECURITY; Schema: public; Owner: autopost_admin
--

ALTER TABLE public.autopostvn_post_schedules ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5275 (class 0 OID 40876)
-- Dependencies: 221
-- Name: autopostvn_posts; Type: ROW SECURITY; Schema: public; Owner: autopost_admin
--

ALTER TABLE public.autopostvn_posts ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5274 (class 0 OID 40854)
-- Dependencies: 220
-- Name: autopostvn_social_accounts; Type: ROW SECURITY; Schema: public; Owner: autopost_admin
--

ALTER TABLE public.autopostvn_social_accounts ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5284 (class 0 OID 41078)
-- Dependencies: 230
-- Name: autopostvn_user_social_accounts; Type: ROW SECURITY; Schema: public; Owner: autopost_admin
--

ALTER TABLE public.autopostvn_user_social_accounts ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5283 (class 0 OID 41064)
-- Dependencies: 229
-- Name: autopostvn_user_workspaces; Type: ROW SECURITY; Schema: public; Owner: autopost_admin
--

ALTER TABLE public.autopostvn_user_workspaces ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5282 (class 0 OID 41025)
-- Dependencies: 228
-- Name: autopostvn_webhooks; Type: ROW SECURITY; Schema: public; Owner: autopost_admin
--

ALTER TABLE public.autopostvn_webhooks ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5273 (class 0 OID 40841)
-- Dependencies: 219
-- Name: autopostvn_workspaces; Type: ROW SECURITY; Schema: public; Owner: autopost_admin
--

ALTER TABLE public.autopostvn_workspaces ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5298 (class 3256 OID 41057)
-- Name: autopostvn_account_performance dev_all_account_performance; Type: POLICY; Schema: public; Owner: autopost_admin
--

CREATE POLICY dev_all_account_performance ON public.autopostvn_account_performance USING (true) WITH CHECK (true);


--
-- TOC entry 5293 (class 3256 OID 41052)
-- Name: autopostvn_analytics_events dev_all_analytics_events; Type: POLICY; Schema: public; Owner: autopost_admin
--

CREATE POLICY dev_all_analytics_events ON public.autopostvn_analytics_events USING (true) WITH CHECK (true);


--
-- TOC entry 5295 (class 3256 OID 41054)
-- Name: autopostvn_api_keys dev_all_api_keys; Type: POLICY; Schema: public; Owner: autopost_admin
--

CREATE POLICY dev_all_api_keys ON public.autopostvn_api_keys USING (true) WITH CHECK (true);


--
-- TOC entry 5294 (class 3256 OID 41053)
-- Name: autopostvn_error_logs dev_all_error_logs; Type: POLICY; Schema: public; Owner: autopost_admin
--

CREATE POLICY dev_all_error_logs ON public.autopostvn_error_logs USING (true) WITH CHECK (true);


--
-- TOC entry 5297 (class 3256 OID 41056)
-- Name: autopostvn_post_analytics dev_all_post_analytics; Type: POLICY; Schema: public; Owner: autopost_admin
--

CREATE POLICY dev_all_post_analytics ON public.autopostvn_post_analytics USING (true) WITH CHECK (true);


--
-- TOC entry 5292 (class 3256 OID 41051)
-- Name: autopostvn_post_schedules dev_all_post_schedules; Type: POLICY; Schema: public; Owner: autopost_admin
--

CREATE POLICY dev_all_post_schedules ON public.autopostvn_post_schedules USING (true) WITH CHECK (true);


--
-- TOC entry 5291 (class 3256 OID 41050)
-- Name: autopostvn_posts dev_all_posts; Type: POLICY; Schema: public; Owner: autopost_admin
--

CREATE POLICY dev_all_posts ON public.autopostvn_posts USING (true) WITH CHECK (true);


--
-- TOC entry 5290 (class 3256 OID 41049)
-- Name: autopostvn_social_accounts dev_all_social_accounts; Type: POLICY; Schema: public; Owner: autopost_admin
--

CREATE POLICY dev_all_social_accounts ON public.autopostvn_social_accounts USING (true) WITH CHECK (true);


--
-- TOC entry 5296 (class 3256 OID 41055)
-- Name: autopostvn_webhooks dev_all_webhooks; Type: POLICY; Schema: public; Owner: autopost_admin
--

CREATE POLICY dev_all_webhooks ON public.autopostvn_webhooks USING (true) WITH CHECK (true);


--
-- TOC entry 5289 (class 3256 OID 41048)
-- Name: autopostvn_workspaces dev_all_workspaces; Type: POLICY; Schema: public; Owner: autopost_admin
--

CREATE POLICY dev_all_workspaces ON public.autopostvn_workspaces USING (true) WITH CHECK (true);


--
-- TOC entry 5301 (class 3256 OID 41133)
-- Name: autopostvn_oauth_sessions user_oauth_sessions_policy; Type: POLICY; Schema: public; Owner: autopost_admin
--

CREATE POLICY user_oauth_sessions_policy ON public.autopostvn_oauth_sessions USING (((user_email)::text = current_setting('app.current_user_email'::text, true)));


--
-- TOC entry 5300 (class 3256 OID 41132)
-- Name: autopostvn_user_social_accounts user_social_accounts_policy; Type: POLICY; Schema: public; Owner: autopost_admin
--

CREATE POLICY user_social_accounts_policy ON public.autopostvn_user_social_accounts USING (((user_email)::text = current_setting('app.current_user_email'::text, true)));


--
-- TOC entry 5299 (class 3256 OID 41131)
-- Name: autopostvn_user_workspaces user_workspace_policy; Type: POLICY; Schema: public; Owner: autopost_admin
--

CREATE POLICY user_workspace_policy ON public.autopostvn_user_workspaces USING (((user_email)::text = current_setting('app.current_user_email'::text, true)));


-- Completed on 2025-11-13 21:46:49

--
-- PostgreSQL database dump complete
--

