'use client';

import { CSSProperties, JSX } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import './AboutTeam.scss';

const TEAM = [
	{ key: 'member1', tags: ['Node.js', 'React', 'MongoDB', 'Next.js', 'FinTech APIs'], image: '/images/team/team1.webp' },
	{ key: 'member2', tags: ['Figma', 'UI/UX', 'Prototyping', 'Web Design'], image: '/images/team/team2.webp' },
	{ key: 'member4', tags: ['Project Management', 'Client Relations', 'Agile', 'Coordination'], image: '/images/team/team3.webp' },
	{ key: 'member3', tags: ['Social Media', 'Content Strategy', 'Analytics', 'Automation'], image: '/images/team/team4.webp' }
] as const;

// «Команда» — Figma Desktop 8: «рваний» темно-синій фон (як «Наші роботи»), заголовок по центру, картки людей
export default function AboutTeam(): JSX.Element {
	const t = useTranslations('AboutPage');

	return (
		<section className="about-team" aria-labelledby="about-team-title">
			<div className="about-team__bg" aria-hidden="true" />
			<div className="container container--design">
				<h2 className="about-team__title" id="about-team-title" data-reveal="">
					{t('team.title')}
				</h2>
				<p className="about-team__subtitle" data-reveal="">
					{t('team.subtitle')}
				</p>

				<ul className="about-team__grid">
					{TEAM.map((member, index) => (
						<li
							key={member.key}
							className="about-team__card"
							data-reveal=""
							style={{ '--reveal-delay': `${0.08 * index}s` } as CSSProperties}
						>
							<div className="about-team__photo">
								<Image
									src={member.image}
									alt={t(`team.${member.key}.name`)}
									fill
									sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 320px"
								/>
							</div>
							<h3 className="about-team__name">{t(`team.${member.key}.name`)}</h3>
							<p className="about-team__position">{t(`team.${member.key}.position`)}</p>
							<p className="about-team__description">{t(`team.${member.key}.description`)}</p>
							<ul className="about-team__tags">
								{member.tags.map((tag) => (
									<li key={tag}>{tag}</li>
								))}
							</ul>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
