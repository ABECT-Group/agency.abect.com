import React, { JSX } from 'react';
import type { Portfolio } from '@/payload-types';

import ProjectHero from './ProjectHero/ProjectHero';
import ProjectContent from './ProjectContent/ProjectContent';
import RelatedProjects from './RelatedProjects/RelatedProjects';
import ScrollReveal from '@/client/components/ScrollReveal/ScrollReveal';

interface ProjectProps {
    project: Portfolio;
    relatedProjects: Portfolio[];
    locale: string;
}

// Сторінка кейсу в стилі нового дизайну: шапка + обкладинка → зміст і текст → схожі проєкти
function Project({ locale, relatedProjects, project }: ProjectProps): JSX.Element {
    return (
        <main>
            <ProjectHero project={project} locale={locale} />
            <ProjectContent project={project} />
            <RelatedProjects projects={relatedProjects} locale={locale} />
            <ScrollReveal />
        </main>
    );
}

export default Project