import React, { JSX } from 'react';
import type { Portfolio } from '@/payload-types';

import ProjectHero from './ProjectHero/ProjectHero';
import ProjectContent from './ProjectContent/ProjectContent';
import RelatedProjects from './RelatedProjects/RelatedProjects';
import ScrollReveal from '@/client/components/ScrollReveal/ScrollReveal';
import { toCardPortfolio } from '@/client/lib/cards';

interface ProjectProps {
    project: Portfolio;
    relatedProjects: Portfolio[];
    locale: string;
}

// Сторінка кейсу в стилі нового дизайну: шапка + обкладинка → зміст і текст → схожі проєкти
function Project({ locale, relatedProjects, project }: ProjectProps): JSX.Element {
    return (
        <main>
            {/* У клієнтські компоненти — лише потрібні поля, не весь документ (ISS-049) */}
            <ProjectHero project={toCardPortfolio(project)} locale={locale} />
            <ProjectContent
                project={{ content: project.content, title: project.title, shortDescription: project.shortDescription, projectDate: project.projectDate }}
            />
            <RelatedProjects projects={relatedProjects.map(toCardPortfolio)} locale={locale} />
            <ScrollReveal />
        </main>
    );
}

export default Project