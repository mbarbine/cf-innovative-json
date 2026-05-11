import type { MetadataRoute } from 'next'
import { getSitemapEntries } from '@/lib/discovery'

export default function sitemap(): MetadataRoute.Sitemap {
  return getSitemapEntries()
}
