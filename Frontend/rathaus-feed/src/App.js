// App.jsx
import React, { useEffect, useState } from "react";
import "./App.css";
import Feed from "./feed/feed.js";
import ArticleView from "./article/ArticleView";
import PhoneFrame from "./components/PhoneFrame";
import useArticleSelection from "./hooks/useArticleSelection";

const PLACEHOLDER_IMAGE = "/placeholder_image.png";

function bufferObjectToDataUrl(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.type === "Buffer" && Array.isArray(raw.data)) {
    const uint8 = Uint8Array.from(raw.data);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < uint8.length; i += chunkSize) {
      const chunk = uint8.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    const base64 = btoa(binary);
    return `data:image/png;base64,${base64}`;
  }

  if (raw instanceof ArrayBuffer || ArrayBuffer.isView(raw)) {
    const view = raw instanceof ArrayBuffer ? new Uint8Array(raw) : new Uint8Array(raw.buffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < view.length; i += chunkSize) {
      const chunk = view.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    const base64 = btoa(binary);
    return `data:image/png;base64,${base64}`;
  }

  return null;
}

function normalizeImageSource(raw) {
  if (raw == null) return PLACEHOLDER_IMAGE;

  const bufferImage = bufferObjectToDataUrl(raw);
  if (bufferImage) return bufferImage;

  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) return PLACEHOLDER_IMAGE;

  if (trimmed.startsWith("data:")) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")) {
    return trimmed;
  }

  const base64Candidate = trimmed.replace(/\s+/g, "");
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(base64Candidate)) {
    return `data:image/png;base64,${base64Candidate}`;
  }

  return PLACEHOLDER_IMAGE;
}

function LeftScreen({
  posts,
  onSelectArticle,
  onHoverArticle,
  onHoverEnd,
  onPressStart,
  onPressEnd,
}) {
  return (
    <div className="screen-content">
      <Feed
        posts={posts}
        onSelectArticle={onSelectArticle}
        onHoverArticle={onHoverArticle}
        onHoverEnd={onHoverEnd}
        onPressStart={onPressStart}
        onPressEnd={onPressEnd}
      />
    </div>
  );
}

export default function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/posts")
      .then((res) => res.json())
      .then((backendPosts) => {
        console.log("Fetched posts:", backendPosts);
        const mappedData = backendPosts.map((post, index) => {
          const backendFeed = post.feed || {};
          const backendArticle = post.article || {};
          const hashtags = (post.hashtags || []).map((tag) =>
            tag?.startsWith("#") ? tag : `#${tag}`
          );
          const fallbackKey = post.id != null ? post.id.toString() : `post-${index}`;
          const rawImage = post.image || backendArticle.image || backendFeed.image;
          const image = normalizeImageSource(rawImage);
          const articleImage = backendArticle.image
            ? normalizeImageSource(backendArticle.image)
            : image;

          return {
            id: post.id,
            key: post.key || fallbackKey,
            image,
            feed: {
              name: backendFeed.name || post.title || "Unbenannt",
              time: backendFeed.time || post.createdAt,
              text: backendFeed.text || post.summary || "",
              comments: backendFeed.comments ?? 0,
            },
            article: {
              title: backendArticle.title || post.title || "Unbenannt",
              time: backendArticle.time || backendFeed.time || post.createdAt,
              lede: backendArticle.lede || post.summary || "",
              image: articleImage,
              kidsSummary:
                backendArticle.kidsSummary || backendArticle.kids_summary || post.kids_summary ||
                "Not available yet.",
              hashtags,
              glossary: backendArticle.glossary || [],
              body:
                backendArticle.body && backendArticle.body.length
                  ? backendArticle.body
                  : [post.content || post.summary || ""],
            },
          };
        });
        setData(mappedData);
      })
      .catch((err) => console.error("Failed to fetch posts:", err));
  }, []);

  const {
    posts,
    pageRootRef,
    rightPhoneRef,
    activeArticle,
    lineStyle,
    isPressing,
    handleSelectArticle,
    handleHoverArticle,
    handleHoverEnd,
    handlePressStart,
    handlePressEnd,
  } = useArticleSelection(data);

  const rightFrameClass = [
    lineStyle ? "phone-frame--highlight" : "",
    isPressing ? "phone-frame--press" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="page-root" ref={pageRootRef}>
      {lineStyle && (
        <div
          className="hover-line"
          style={lineStyle}
        />
      )}
      <div className="phones-wrapper">
        <PhoneFrame>
          <LeftScreen
            posts={posts}
            onSelectArticle={handleSelectArticle}
            onHoverArticle={handleHoverArticle}
            onHoverEnd={handleHoverEnd}
            onPressStart={handlePressStart}
            onPressEnd={handlePressEnd}
          />
        </PhoneFrame>

        <PhoneFrame frameRef={rightPhoneRef} className={rightFrameClass}>
          <ArticleView article={activeArticle} />
        </PhoneFrame>
      </div>
    </div>
  );
}
