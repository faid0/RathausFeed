import React from "react";
import "./feed.css";
import { TAG_COLORS, colorIndexForTag } from "../utils/tagColors";

const Feed = ({
	posts,
	onSelectArticle,
	onHoverArticle,
	onHoverEnd,
	onPressStart,
	onPressEnd,
}) => {
	return (
		<div className="sf-root">
			<header className="sf-header">
				<div className="sf-header-title">Rathaus Feed</div>
			</header>

			<div className="sf-feed">
				{posts.map((post) => (
					<article key={post.id} className="sf-card">
						<div className="sf-card-header">
							<div className="sf-card-header-text">
								<span className="sf-card-name">{post.name}</span>
								<span className="sf-card-time">{post.time}</span>
							</div>
						</div>

						<p className="sf-card-text">{post.text}</p>
						{post.hashtags?.length > 0 && (
							<div className="sf-tag-row">
								{post.hashtags.map((tag) => {
									const colorIndex = colorIndexForTag(tag, TAG_COLORS.length);
									return (
										<span
											key={tag}
											className={`sf-tag sf-tag--c${colorIndex}`}
										>
										{tag}
									</span>
									);
								})}
							</div>
						)}

						{post.image && (
							<div className="sf-card-image-wrapper">
								<img
									className="sf-card-image"
									src={post.image}
									alt="Post visual"
								/>
							</div>
						)}

						<div className="sf-card-footer">
							<button
								className="sf-footer-btn sf-read-more-btn"
								onMouseEnter={(e) => onHoverArticle?.(post.articleKey, e.currentTarget)}
								onMouseLeave={() => {
									onHoverEnd?.();
									onPressEnd?.();
								}}
								onMouseDown={(e) => onPressStart?.(post.articleKey, e.currentTarget)}
								onMouseUp={() => onPressEnd?.()}
								onClick={() => onSelectArticle?.(post.articleKey)}
							>
								<span>Mehr lesen</span>
								<i className="fa-solid fa-arrow-right-long sf-footer-icon" aria-hidden="true"></i>
							</button>
							<div className="sf-footer-meta">
								<span className="sf-footer-icon">💬</span>
								<span>{post.comments}</span>
							</div>
							<button className="sf-footer-btn sf-footer-btn-secondary" aria-label="Share">
								<i className="fa-solid fa-share sf-footer-icon" aria-hidden="true"></i>
								<span className="sf-footer-label">Teilen</span>
							</button>
						</div>
					</article>
				))}
			</div>
		</div>
	);
};

export default Feed;
