'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { LOCAL_IMAGE_FALLBACK } from '../../../lib/imageFallback';

function initialSrc(src, fallbackSrc) {
	const t = src == null ? '' : String(src).trim();
	return t || fallbackSrc;
}

function isExternalHttpUrl(src) {
	return typeof src === 'string' && /^https?:\/\//i.test(src.trim());
}

export default function ImageWithFallback({
	src,
	fallbackSrc = LOCAL_IMAGE_FALLBACK,
	alt,
	onError,
	fill,
	unoptimized,
	style,
	className,
	width,
	height,
	sizes,
	...rest
}) {
	const [imgSrc, setImgSrc] = useState(() => initialSrc(src, fallbackSrc));
	const [swapUsed, setSwapUsed] = useState(false);

	useEffect(() => {
		setImgSrc(initialSrc(src, fallbackSrc));
		setSwapUsed(false);
	}, [src, fallbackSrc]);

	const handleError = useCallback(
		(e) => {
			if (swapUsed || imgSrc === fallbackSrc) {
				onError?.(e);
				return;
			}
			setSwapUsed(true);
			setImgSrc(fallbackSrc);
			onError?.(e);
		},
		[swapUsed, imgSrc, fallbackSrc, onError]
	);

	// Partner RSS images use many domains; next/image blocks hosts outside remotePatterns.
	if (isExternalHttpUrl(imgSrc)) {
		if (fill) {
			return (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={imgSrc}
					alt={alt ?? ''}
					onError={handleError}
					referrerPolicy="no-referrer"
					className={className}
					sizes={sizes}
					style={{
						position: 'absolute',
						inset: 0,
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						...style,
					}}
					{...rest}
				/>
			);
		}

		return (
			// eslint-disable-next-line @next/next/no-img-element
			<img
				src={imgSrc}
				alt={alt ?? ''}
				onError={handleError}
				referrerPolicy="no-referrer"
				className={className}
				width={width}
				height={height}
				style={style}
				{...rest}
			/>
		);
	}

	return (
		<Image
			src={imgSrc}
			alt={alt ?? ''}
			onError={handleError}
			fill={fill}
			unoptimized={unoptimized}
			style={style}
			className={className}
			width={width}
			height={height}
			sizes={sizes}
			{...rest}
		/>
	);
}
