// 공통 아이콘 (Figma 디자인 · 웜 파스텔)
// 색은 currentColor → className의 text-* 로 바꾼다.
// 예) <HomeIcon className="text-primary-strong" />  <HomeIcon size={22} />
import type { ReactNode, SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & { size?: number };

function Base({ size = 24, strokeWidth = 2, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

// 하단 내비게이션
export const RecordIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16z" />
    <path d="m13.5 6.5 4 4" />
  </Base>
);
export const GuideIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <path d="M14 3v6h6M8 13h8M8 17h5" />
  </Base>
);
export const HomeIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </Base>
);
export const SupportIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
  </Base>
);
export const UserIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Base>
);

// 헤더·상태 화면
export const ChevronLeftIcon = (p: IconProps) => (
  <Base strokeWidth={2.2} {...p}>
    <path d="m15 6-6 6 6 6" />
  </Base>
);
export const AlertIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3 2 20h20z" />
    <path d="M12 10v4M12 17h.01" />
  </Base>
);