import React from 'react';
import { notFound } from 'next/navigation';
import { MODULES, getModuleContent } from '@/lib/modules';
import InteractiveReader from '@/components/InteractiveReader';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return MODULES.map((m) => ({
    slug: m.slug,
  }));
}

export default async function ModulePage({ params }: Props) {
  const { slug } = await params;
  const data = getModuleContent(slug);

  if (!data) {
    notFound();
  }

  const { meta, html, toc } = data;

  return (
    <InteractiveReader
      key={slug}
      slug={slug}
      meta={meta}
      initialHtml={html}
      toc={toc}
    />
  );
}
