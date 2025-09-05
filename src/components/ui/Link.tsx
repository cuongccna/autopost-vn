import NextLink from 'next/link'
import { ReactNode } from 'react'

interface LinkProps {
  href: string
  children: ReactNode
  className?: string
  [key: string]: any
}

export default function Link({ href, children, ...props }: LinkProps) {
  return (
    <NextLink href={href as any} {...props}>
      {children}
    </NextLink>
  )
}
