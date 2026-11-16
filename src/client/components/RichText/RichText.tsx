'use client';

import React, { useMemo } from 'react';
import { RichText } from '@payloadcms/richtext-lexical/react';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react';
import type { DefaultNodeTypes } from '@payloadcms/richtext-lexical';
import { collectHeadings } from '@/utils/richTextHeadings';
import "./RichText.scss"

interface RichTextWithAnchorsProps {
    data: SerializedEditorState;
}

// Заголовки h2 / h3 отримують id для змісту (RichTextHeadings). id беруться з collectHeadings —
// тієї ж функції, що будує зміст, тож посилання змісту завжди ведуть на свій заголовок.
const makeConverters = (ids: WeakMap<object, string>): JSXConvertersFunction<DefaultNodeTypes> => ({ defaultConverters }) => ({
    ...defaultConverters,
    heading: ({ node, nodesToJSX }) => {
        const text = nodesToJSX({ nodes: node.children });
        // H1 сторінки — її заголовок (PageHero / шапка статті); H1 з тексту CMS — як H2,
        // інакше на сторінці два H1 (ISS-055)
        const Tag = node.tag === 'h1' ? 'h2' : node.tag;
        const id = ids.get(node);
        return id ? <Tag id={id}>{text}</Tag> : <Tag>{text}</Tag>;
    },
});

class RichTextErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(error: Error) { console.error('[RichText] render error:', error); }
    render() {
        if (this.state.hasError) return <div className="RichText RichText--error" />;
        return this.props.children;
    }
}

export default function RichTextWithAnchors({ data }: RichTextWithAnchorsProps) {
    const converters = useMemo(() => {
        const ids = new WeakMap<object, string>();
        collectHeadings(data).forEach((heading) => ids.set(heading.node, heading.id));
        return makeConverters(ids);
    }, [data]);

    return (
        <RichTextErrorBoundary>
            <div className="RichText">
                <RichText data={data} converters={converters} />
            </div>
        </RichTextErrorBoundary>
    )
}