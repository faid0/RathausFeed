// App.jsx
import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import Feed from "./feed/feed.js";
import ArticleView from "./article/ArticleView";
import PhoneFrame from "./components/PhoneFrame";
import useArticleSelection from "./hooks/useArticleSelection";

const PLACEHOLDER_IMAGE = "/placeholder_image.png";
const FEED_SLIDE_INDEX = 2; // 0-based index: slide 3 of 4
const MOCK_HASHTAG_SETS = [
  ["#housing", "#budget", "#munich"],
  ["#climate", "#schools", "#retrofit"],
  ["#mobility", "#bikepath", "#accessibility"],
  ["#transparency", "#cityhall", "#civictech"],
  ["#community", "#participation", "#publicspace"],
];

function pickMockHashtags(key) {
  const safeKey = key || "fallback";
  const charSum = safeKey.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return MOCK_HASHTAG_SETS[charSum % MOCK_HASHTAG_SETS.length];
}

function normalizeHashtags(rawTags, fallbackKey) {
  const normalized = (rawTags || [])
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));

  return normalized.length ? normalized : pickMockHashtags(fallbackKey);
}

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

function PlaceholderSlide({ label, title, description }) {
  return (
    <div className="placeholder-card">
      <p className="placeholder-kicker">{label}</p>
      <h2 className="placeholder-title">{title}</h2>
      <p className="placeholder-copy">{description}</p>
    </div>
  );
}

function IntroSlide() {
  return (
    <div className="intro-hero">
      <img
        className="intro-image"
        src="/cover_image.png"
        alt="Cover"
      />
      <div className="intro-tag">#RathausFeed</div>
      <p className="intro-desc">
        We translate City Hall&apos;s <i>Amtsdeutsch</i> into a digital noticeboard for the average citizen.
      </p>
    </div>
  );
}

function StorySlide() {
  return (
    <div className="story-stage" aria-label="Story slide content area">
      <img className="story-image" src="/Sources.png" alt="Sources" />
    </div>
  );
}

function OutroSlide() {
  return (
    <div className="outro-stage">
      <h2 className="outro-title">Why?</h2>
      <p className="outro-copy">
        Democracy has a UX problem. The public conversation has a hostile interface.
      </p>
    </div>
  );
}

function FeedSlide({
  posts,
  onSelectArticle,
  onHoverArticle,
  onHoverEnd,
  onPressStart,
  onPressEnd,
  activeArticle,
  rightPhoneRef,
  rightFrameClass,
  lineStyle,
}) {
  return (
    <div className="phones-wrapper">
      {lineStyle && <div className="hover-line" style={lineStyle} />}
      <PhoneFrame>
        <LeftScreen
          posts={posts}
          onSelectArticle={onSelectArticle}
          onHoverArticle={onHoverArticle}
          onHoverEnd={onHoverEnd}
          onPressStart={onPressStart}
          onPressEnd={onPressEnd}
        />
      </PhoneFrame>

      <PhoneFrame frameRef={rightPhoneRef} className={rightFrameClass}>
        <ArticleView article={activeArticle} />
      </PhoneFrame>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(FEED_SLIDE_INDEX);
  const navigateRef = useRef(() => {});

  useEffect(() => {
    fetch("http://localhost:8000/posts")
      .then((res) => res.json())
      .then((backendPosts) => {
        console.log("Fetched posts:", backendPosts);
        const mappedData = backendPosts.map((post, index) => {
          const backendFeed = post.feed || {};
          const backendArticle = post.article || {};
          const fallbackKey = post.id != null ? post.id.toString() : `post-${index}`;
          const key = post.key || fallbackKey;
          const hashtags = normalizeHashtags(
            post.hashtags || backendArticle.hashtags,
            key
          );
          const rawImage = post.image || backendArticle.image || backendFeed.image;
          const image = normalizeImageSource(rawImage);
          const articleImage = backendArticle.image
            ? normalizeImageSource(backendArticle.image)
            : image;

          return {
            id: post.id,
            key,
            hashtags,
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

  const slides = [
    { key: "intro", className: "slide slide--intro", element: <IntroSlide /> },
    { key: "story", className: "slide slide--story", element: <StorySlide /> },
    {
      key: "feed",
      className: "slide slide--feed",
      element: (
        <FeedSlide
          posts={posts}
          onSelectArticle={handleSelectArticle}
          onHoverArticle={handleHoverArticle}
          onHoverEnd={handleHoverEnd}
          onPressStart={handlePressStart}
          onPressEnd={handlePressEnd}
          activeArticle={activeArticle}
          rightPhoneRef={rightPhoneRef}
          rightFrameClass={rightFrameClass}
          lineStyle={currentSlide === FEED_SLIDE_INDEX ? lineStyle : null}
        />
      ),
    },
    { key: "outro", className: "slide slide--outro", element: <OutroSlide /> },
  ];

  const totalSlides = slides.length;

  const moveToSlide = (delta) => {
    setCurrentSlide((prev) => {
      const next = Math.min(Math.max(prev + delta, 0), totalSlides - 1);
      if (next !== FEED_SLIDE_INDEX) {
        handleHoverEnd();
        handlePressEnd();
      }
      return next;
    });
  };

  navigateRef.current = moveToSlide;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowRight") {
        navigateRef.current(1);
      } else if (event.key === "ArrowLeft") {
        navigateRef.current(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="page-root" ref={pageRootRef}>
      <div className="slides-viewport">
        <div
          className="slides-track"
          style={{ transform: `translateX(-${currentSlide * 100}vw)` }}
        >
          {slides.map(({ key, className, element }) => (
            <section key={key} className={className}>
              {element}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
