import type { CSSProperties, JSX } from 'react';
import Image from 'next/image';
import './FloatingDecor.scss';

/**
 * Рух об'єкта (FloatingDecor.scss):
 * sway — плавно вгору-вниз із легким поворотом; breathe — «дихання» (масштаб + нахил);
 * spring — пружина (стискається й розтягується); orbit — повільне коло з поворотом;
 * pendulum — маятник від нижнього краю; none — нерухомий.
 */
export type DecorMotion = 'sway' | 'breathe' | 'spring' | 'orbit' | 'pendulum' | 'none';

type FloatingDecorProps = {
	src: string;
	width: number;
	height: number;
	/** Класи позиціонування (position / left / top / width / translate / rotate) — на обгортці */
	className?: string;
	motion?: DecorMotion;
	/** Затримка появи при прокрутці (ScrollReveal, data-reveal="pop"), с */
	revealDelay?: number;
	/** Тривалість циклу руху, с; різні значення — щоб об'єкти не рухались синхронно */
	duration?: number;
	/** Зсув фази руху, с */
	offset?: number;
};

/**
 * Декоративний 3D-об'єкт (Figma «ABECT»: крапля, синій об'єкт, спіраль). За замовчуванням нерухомий
 * (рішення розробника 2026-11-11); безкінечний рух вмикається пропом motion.
 * Рух — transform на обгортці, поява при прокрутці — transform на зображенні: не конфліктують
 * між собою і з translate / rotate, якими обгортку позиціонують.
 */
export default function FloatingDecor({
	src,
	width,
	height,
	className = '',
	motion = 'none',
	revealDelay = 0,
	duration = 7,
	offset = 0
}: FloatingDecorProps): JSX.Element {
	return (
		<span
			className={`floating-decor floating-decor--${motion} ${className}`.trim()}
			aria-hidden="true"
			style={{ '--decor-duration': `${duration}s`, '--decor-offset': `${-offset}s` } as CSSProperties}
		>
			<Image
				src={src}
				alt=""
				width={width}
				height={height}
				data-reveal="pop"
				style={{ '--reveal-delay': `${revealDelay}s` } as CSSProperties}
			/>
		</span>
	);
}
