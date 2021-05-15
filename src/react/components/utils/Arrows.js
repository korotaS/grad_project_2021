import React from "react";
import '../../styles/arrows.css'

export function RightArrow() {
    return (
        <button className="arrow right">
            <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="60px"
                 height="80px" viewBox="0 0 50 80" xmlSpace="preserve">
                <polyline fill="none" stroke="#000000" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
                          points="
	                0.375,0.375 45.63,38.087 0.375,75.8 "/>
            </svg>
        </button>
    )
}

export function LeftArrow() {
    return (
        <button className="arrow left">
            <svg width="60px" height="80px" viewBox="0 0 50 80" xmlSpace="preserve">
                <polyline fill="none" stroke="#000000" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
                          points="
	            45.63,75.8 0.375,38.087 45.63,0.375 "/>
            </svg>
        </button>
    )
}