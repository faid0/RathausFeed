import { useMemo, useRef, useState } from "react";

const useArticleSelection = (items) => {
	const articlesByKey = useMemo(() => {
		const map = {};
		items.forEach((item) => {
			const hashtags = item.article?.hashtags || item.hashtags || [];
			map[item.key] = {
				key: item.key,
				image: item.image,
				...item.article,
				hashtags,
			};
		});
		return map;
	}, [items]);

	const posts = useMemo(
		() =>
			items.map((item) => ({
				id: item.id,
				name: item.feed.name,
				time: item.feed.time,
				text: item.feed.text,
				image: item.image,
				comments: item.feed.comments,
				articleKey: item.key,
				hashtags: item.article?.hashtags || item.hashtags || [],
			})),
		[items]
	);

	const defaultArticleKey = posts[0]?.articleKey || items[0]?.key || null;
	const [selectedArticleKey, setSelectedArticleKey] = useState(defaultArticleKey);
	const [hoveredArticleKey, setHoveredArticleKey] = useState(null);
	const [linePosition, setLinePosition] = useState(null);
	const [isPressing, setIsPressing] = useState(false);

	const pageRootRef = useRef(null);
	const rightPhoneRef = useRef(null);

	const activeArticleKey = hoveredArticleKey || selectedArticleKey;
	const activeArticle = activeArticleKey ? articlesByKey[activeArticleKey] : null;

	const updateLinePosition = (buttonEl) => {
		if (!pageRootRef.current || !rightPhoneRef.current || !buttonEl) return;
		const rootRect = pageRootRef.current.getBoundingClientRect();
		const fromRect = buttonEl.getBoundingClientRect();
		const toRect = rightPhoneRef.current.getBoundingClientRect();

		const startX = fromRect.left + fromRect.width / 2 - rootRect.left;
		const startY = fromRect.top + fromRect.height / 2 - rootRect.top;
		const endX = toRect.left + toRect.width / 2 - rootRect.left;
		const endY = toRect.top + toRect.height / 2 - rootRect.top;

		const dx = endX - startX;
		const dy = endY - startY;
		const length = Math.sqrt(dx * dx + dy * dy);
		const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

		setLinePosition({
			left: startX,
			top: startY,
			length,
			angle,
		});
	};

	const handleHoverArticle = (articleKey, buttonEl) => {
		setHoveredArticleKey(articleKey);
		updateLinePosition(buttonEl);
	};

	const handleHoverEnd = () => {
		setHoveredArticleKey(null);
		setLinePosition(null);
		setIsPressing(false);
	};

	const handlePressStart = (articleKey, buttonEl) => {
		setIsPressing(true);
		setHoveredArticleKey(articleKey);
		updateLinePosition(buttonEl);
	};

	const handlePressEnd = () => {
		setIsPressing(false);
	};

	const lineStyle = linePosition
		? {
				left: linePosition.left,
				top: linePosition.top,
				width: linePosition.length,
				transform: `translateY(-1.5px) rotate(${linePosition.angle}deg)`,
				background: isPressing ? "#1d4ed8" : "#2563eb",
				boxShadow: isPressing
					? "0 0 0 2px rgba(29, 78, 216, 0.15)"
					: "0 0 0 2px rgba(37, 99, 235, 0.1)",
		  }
		: null;

	return {
		posts,
		articlesByKey,
		pageRootRef,
		rightPhoneRef,
		activeArticle,
		lineStyle,
		isPressing,
		handleSelectArticle: setSelectedArticleKey,
		handleHoverArticle,
		handleHoverEnd,
		handlePressStart,
		handlePressEnd,
	};
};

export default useArticleSelection;
