"use client";
import { useId } from "react";

/** Original Figma vectors grouped so each stair can move independently. */
export function ExperienceStairs() {
  const prefix = useId();
  return (
    <svg
      className="experience-stairs"
      width="550"
      height="530"
      viewBox="0 0 550 530"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M506 262C506 375.771 413.771 468 300 468C186.229 468 94 375.771 94 262C94 148.229 186.229 56 300 56C413.771 56 506 148.229 506 262Z"
        stroke="#22304B"
      />
      <path
        d="M461 262C461 350.918 388.918 423 300 423C211.082 423 139 350.918 139 262C139 173.082 211.082 101 300 101C388.918 101 461 173.082 461 262Z"
        stroke="#22304B"
      />
      <path d="M25 365L298 205L530 337L255 497L25 365Z" fill="#111D34" />
      <g className="experience-stairs__cube experience-stairs__cube--one">
        <path
          d="M45 332L161 266L263 323L147 391L45 332Z"
          fill={`url(#${prefix}-0)`}
        />
        <path d="M45 332L147 391V445L45 386V332Z" fill="#263A8B" />
        <path
          d="M147 391L263 323V377L147 445V391Z"
          fill={`url(#${prefix}-1)`}
        />
      </g>
      <g className="experience-stairs__cube experience-stairs__cube--two">
        <path
          d="M170 245L286 179L388 236L272 304L170 245Z"
          fill={`url(#${prefix}-2)`}
        />
        <path d="M170 245L272 304V417L170 358V245Z" fill="#344CA6" />
        <path
          d="M272 304L388 236V349L272 417V304Z"
          fill={`url(#${prefix}-3)`}
        />
      </g>
      <g className="experience-stairs__cube experience-stairs__cube--three">
        <path
          d="M295 157L411 91L513 148L397 216L295 157Z"
          fill={`url(#${prefix}-4)`}
        />
        <path d="M295 157L397 216V389L295 331V157Z" fill="#435FD1" />
        <path
          d="M397 216L513 148V321L397 389V216Z"
          fill={`url(#${prefix}-5)`}
        />
        <path
          d="M411 99C415.418 99 419 95.4183 419 91C419 86.5817 415.418 83 411 83C406.582 83 403 86.5817 403 91C403 95.4183 406.582 99 411 99Z"
          fill="#D8E0FF"
        />
      </g>
      <g className="experience-stairs__orbit">
        <circle cx="300" cy="56" r="4" fill="#A9B8FF" />
      </g>
      <defs>
        <linearGradient
          id={`${prefix}-0`}
          x1="45"
          y1="266"
          x2="152.88"
          y2="454.142"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#A9B8FF" />
          <stop offset="1" stopColor="#435FD1" />
        </linearGradient>
        <linearGradient
          id={`${prefix}-1`}
          x1="147"
          y1="323"
          x2="147"
          y2="445"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#435FD1" />
          <stop offset="1" stopColor="#172345" />
        </linearGradient>
        <linearGradient
          id={`${prefix}-2`}
          x1="170"
          y1="179"
          x2="277.88"
          y2="367.142"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#A9B8FF" />
          <stop offset="1" stopColor="#435FD1" />
        </linearGradient>
        <linearGradient
          id={`${prefix}-3`}
          x1="272"
          y1="236"
          x2="272"
          y2="417"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#435FD1" />
          <stop offset="1" stopColor="#172345" />
        </linearGradient>
        <linearGradient
          id={`${prefix}-4`}
          x1="295"
          y1="91"
          x2="402.88"
          y2="279.142"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#A9B8FF" />
          <stop offset="1" stopColor="#435FD1" />
        </linearGradient>
        <linearGradient
          id={`${prefix}-5`}
          x1="397"
          y1="148"
          x2="397"
          y2="389"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#435FD1" />
          <stop offset="1" stopColor="#172345" />
        </linearGradient>
      </defs>
    </svg>
  );
}
