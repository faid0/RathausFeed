import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./article.css";
import { TAG_COLORS, colorIndexForTag } from "../utils/tagColors";

const ArticleView = ({ article }) => {
	const glossary = article?.glossary || [];
	const viewRef = useRef(null);
	const [screenEl, setScreenEl] = useState(null);
	const [overlayHost, setOverlayHost] = useState(null);
	const [activeTerm, setActiveTerm] = useState(null);
	const kidsImagePath = "/lil_journalist.png";

	const termRegex = useMemo(() => {
		if (!glossary.length) return null;
		const escaped = glossary
			.map((g) => g.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
			.filter(Boolean);
		if (!escaped.length) return null;
		return new RegExp(`(${escaped.join("|")})`, "gi");
	}, [glossary]);

	const kidsColorIndex = useMemo(() => {
		if (!article) return 0;
		return colorIndexForTag(
			article.key || article.title || "kids",
			TAG_COLORS.length
		);
	}, [article]);

	useEffect(() => {
		if (!article) return;
		if (!viewRef.current) return;
		const screen = viewRef.current.closest(".phone-screen");
		const frame = screen?.closest(".phone-frame");

		if (screen && !screenEl) setScreenEl(screen);
		if (!overlayHost && (frame || screen)) setOverlayHost(frame || screen);
	}, [article, screenEl, overlayHost]);

	useEffect(() => {
		if (!screenEl) return undefined;
		screenEl.classList.toggle("is-locked", Boolean(activeTerm));
		return () => screenEl.classList.remove("is-locked");
	}, [screenEl, activeTerm]);

	if (!article) {
		return (
			<div className="screen-content article-view">
				<h1 className="article-title">No article selected</h1>
				<p className="article-lede">
					Choose an update from the feed to view its details here.
				</p>
			</div>
		);
	}

	const renderWithTerms = (text) => {
		if (!termRegex) return text;
		const parts = text.split(termRegex);
		return parts.map((part, idx) => {
			const match = glossary.find(
				(g) => g.term.toLowerCase() === part.toLowerCase()
			);
			if (!match) return <React.Fragment key={idx}>{part}</React.Fragment>;
			const colorIndex = colorIndexForTag(match.term, TAG_COLORS.length);
			return (
				<button
					key={`${part}-${idx}`}
					type="button"
					className={`article-term article-tag--c${colorIndex}`}
					onClick={() => setActiveTerm(match)}
				>
					{match.term}
				</button>
			);
		});
	};
	

	const closeSheet = () => setActiveTerm(null);
	const kidsSummary = article.kidsSummary || article.kids_summary || article.lede;
	
	return (
		<div className="screen-content article-view" ref={viewRef}>
			<div className="article-meta">{article.time}</div>
			<h1 className="article-title">{article.title}</h1>
			{article.hashtags?.length > 0 && (
				<div className="article-tags">
					{article.hashtags.map((tag) => {
						const colorIndex = colorIndexForTag(tag, TAG_COLORS.length);
						return (
							<span
								key={tag}
								className={`article-tag article-tag--c${colorIndex}`}
							>
							{tag}
						</span>
						);
					})}
				</div>
			)}
			{article.image && (
				<div className="article-image-wrapper">
					<img className="article-image" src={article.image} alt={article.title} />
				</div>
			)}
			{article.lede && <p className="article-lede">{renderWithTerms(article.lede)}</p>}
			<div className="article-body">
				{article.body?.map((paragraph, idx) => (
					<p key={idx}>{renderWithTerms(paragraph)}</p>
				))}
			</div>
			{kidsSummary && (
				<section
					className={`article-kids-card article-kids-card--c${kidsColorIndex}`}
					aria-label="Kids summary"
				>
					<div className="article-kids-copy">
						<div className="article-kids-label">Für Kinder</div>
						<h3 className="article-kids-title">Kurze Geschichte</h3>
						<p className="article-kids-text">{kidsSummary}</p>
					</div>
					<div
						className="article-kids-image-slot"
						aria-hidden="true"
						style={{
							shapeOutside: `url(${kidsImagePath})`,
							WebkitShapeOutside: `url(${kidsImagePath})`,
						}}
					>
						<img
							src={kidsImagePath}
							alt=""
							className="article-kids-image"
							loading="lazy"
						/>
					</div>
				</section>
			)}
			{overlayHost && activeTerm
				? createPortal(
						<div className="article-glossary-overlay" onClick={closeSheet}>
							<div
								className="article-glossary-sheet"
								onClick={(e) => e.stopPropagation()}
							>
								<div className="article-glossary-handle" />
								<div className="article-glossary-label">Definition</div>
								<h2 className="article-glossary-title">{activeTerm.term}</h2>
								<p className="article-glossary-text">{activeTerm.description}</p>
								<button className="article-glossary-close" type="button" onClick={closeSheet}>
									Close
								</button>
							</div>
						</div>,
						overlayHost
				  )
				: null}
		</div>
	);
};

export default ArticleView;
