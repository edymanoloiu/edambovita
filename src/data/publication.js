/**
 * Configurație centrală a publicației.
 * Domeniul canonic este explicit — nu se deduce din headere HTTP.
 */

const publication = {
	publicationName: "eDâmbovița",
	publicationTagline: "Dâmbovița, în timp real",
	canonicalDomain: "https://edambovita.ro",
	city: "Târgoviște",
	county: "Dâmbovița",
	region: "Sud",
	latitude: 44.925,
	longitude: 25.457,
	locale: 'ro-RO',
	language: 'ro',
	timezone: 'Europe/Bucharest',
	logo: '/images/logo.png',
	defaultSocialImage: '/images/logo.png',
	favicon: '/images/cropped_image.png',
	editorialEmail: 'contact@weboratory.ro',
	legalCompanyName: 'Weboratory Capital SRL',
	publisherInformation: {
		name: 'Weboratory Capital SRL',
		email: 'contact@weboratory.ro',
		website: 'https://www.weboratory.ro',
	},
	socialProfiles: [],
	foundingDate: '2024-01-01',
	coverageArea: "Județul Dâmbovița, România",
	editorialPositioning:
		"Publicație locală dedicată județului Dâmbovița, cu accent pe informații utile, administrație locală și viața comunităților.",
	nearbyLocalities: ["Moreni", "Pucioasa", "Găești", "Titu", "Fieni", "Răcari"],
	mapProvider: 'openstreetmap',
	mapsEnabled: true,
	environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
	isIndexable: process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'preview' && process.env.CF_PAGES_BRANCH !== 'preview',
	localCate: "Azi in Targoviste",
	categorySlug: "azi-in-targoviste",
	tagMinIndexCount: 5,
	correctionEmail: 'contact@weboratory.ro',
	ogLocale: 'ro_RO',
	seo: {
		title: "eDâmbovița - Știri din Dâmbovița și Târgoviște",
		titleTemplate: "%s | eDâmbovița",
		description:
			"Știri din județul Dâmbovița și Târgoviște. Informații locale despre administrație, trafic, evenimente, educație, economie, comunitate și actualitate.",
		homepageH1: "Știri din Dâmbovița",
		homepageIntro:
			"Cele mai noi știri din Târgoviște și județul Dâmbovița, informații despre administrație, trafic, evenimente și comunitățile locale.",
		openGraph: {
			type: "website",
			siteName: "eDâmbovița",
			title: "eDâmbovița - Știrile județului Dâmbovița",
			description:
				"Cele mai importante informații din Târgoviște și județul Dâmbovița: actualitate, administrație, trafic, evenimente și comunitate.",
			locale: "ro_RO",
		},
		twitter: {
			card: "summary_large_image",
			title: "eDâmbovița - Știri locale din Dâmbovița",
			description:
				"Actualitatea din Târgoviște și întreg județul Dâmbovița, într-un singur loc.",
		},
		schema: {
			type: "NewsMediaOrganization",
			name: "eDâmbovița",
			alternateName: "eDambovita.ro",
			areaServed: "Județul Dâmbovița, România",
		},
	},
};

export default publication;
