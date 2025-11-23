import React from "react";

const PhoneFrame = ({ children, frameRef, className = "" }) => {
	const classes = ["phone-frame", className].filter(Boolean).join(" ");
	return (
		<div className={classes} ref={frameRef}>
			<div className="phone-notch" />
			<div className="phone-screen">{children}</div>
		</div>
	);
};

export default PhoneFrame;
