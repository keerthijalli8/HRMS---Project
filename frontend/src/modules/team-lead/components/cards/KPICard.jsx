import React from 'react';

// ============================================================
// MONSOON GLASS COLOR CONFIGURATION
// ============================================================

const colorMap = {
  accent: {
    text: 'text-accent',
    background: 'rgba(110, 231, 208, 0.10)',
    border: 'rgba(110, 231, 208, 0.15)'
  },

  good: {
    text: 'text-good',
    background: 'rgba(94, 234, 212, 0.10)',
    border: 'rgba(94, 234, 212, 0.15)'
  },

  warn: {
    text: 'text-warn',
    background: 'rgba(252, 211, 77, 0.10)',
    border: 'rgba(252, 211, 77, 0.15)'
  },

  bad: {
    text: 'text-bad',
    background: 'rgba(253, 164, 175, 0.10)',
    border: 'rgba(253, 164, 175, 0.15)'
  },

  info: {
    text: 'text-info',
    background: 'rgba(147, 197, 253, 0.10)',
    border: 'rgba(147, 197, 253, 0.15)'
  },

  accent2: {
    text: 'text-accent2',
    background: 'rgba(155, 140, 255, 0.10)',
    border: 'rgba(155, 140, 255, 0.15)'
  }
};

// ============================================================
// KPI CARD COMPONENT
// ============================================================

export const KPICard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'accent',
  onClick
}) => {

  const theme = colorMap[color] || colorMap.accent;

  const CardElement =
    typeof onClick === 'function' ? 'button' : 'div';

  const isClickable = typeof onClick === 'function';

  return (
    <CardElement
      {...(isClickable
        ? {
            type: 'button',
            onClick
          }
        : {})}
      className={`
        group
        relative
        flex
        w-full
        min-w-0
        min-h-[128px]
        flex-col
        justify-between
        overflow-hidden
        rounded-[20px]
        border
        border-white/[0.09]
        bg-surface
        px-5
        py-4
        text-left
        font-body
        backdrop-blur-xl
        transition-all
        duration-200

        ${isClickable
          ? `
            cursor-pointer
            hover:-translate-y-0.5
            hover:border-[#6ee7d04d]
            hover:bg-surface2
            hover:shadow-lg
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[#6ee7d066]
            motion-reduce:transform-none
          `
          : ''
        }
      `}
    >

      {/* ====================================================
          KPI TITLE AND ICON
      ==================================================== */}

      <div className="
        flex min-w-0 items-center
        justify-between gap-3
      ">

        <span
          className="
            kpi-label
            min-w-0
            flex-1
            font-body
            text-[12px]
            font-semibold
            uppercase
            leading-relaxed
            tracking-wider
            text-muted
          "
          title={title}
        >
          {title}
        </span>

        {Icon && (
          <span
            className={`
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              ${theme.text}
            `}
            style={{
              backgroundColor: theme.background,
              borderColor: theme.border
            }}
          >
            <Icon
              size={19}
              strokeWidth={1.6}
              aria-hidden="true"
            />
          </span>
        )}

      </div>

      {/* ====================================================
          KPI VALUE - SPACE MONO
      ==================================================== */}

      <div className="
        mt-2
        flex
        min-w-0
        flex-wrap
        items-center
        justify-between
        gap-2
      ">

        <span
          className="
            kpi-value
            min-w-0
            break-words
            font-data
            text-kpi
            font-bold
            leading-tight
            tracking-tight
            tabular-nums
            text-ink
          "
          style={{
            fontFamily:
              "var(--hrms-data, 'Space Mono', monospace)"
          }}
        >
          {value ?? '—'}
        </span>

        {/* KPI TREND */}

        {trend && (
          <span
            className="
              rounded-md
              border
              px-2
              py-1
              font-body
              text-[11px]
              font-medium
              text-good
            "
            style={{
              backgroundColor:
                'rgba(94, 234, 212, 0.10)',
              borderColor:
                'rgba(94, 234, 212, 0.20)'
            }}
          >
            {trend}
          </span>
        )}

      </div>

      {/* ====================================================
          KPI SUPPORTING DESCRIPTION
      ==================================================== */}

      {subtitle && (
        <span
          className={`
            kpi-description
            mt-1.5
            block
            break-words
            font-body
            text-[13px]
            font-normal
            leading-relaxed

            ${color === 'accent'
              ? 'text-muted'
              : theme.text}
          `}
          title={subtitle}
        >
          {subtitle}
        </span>
      )}

    </CardElement>
  );
};

export default KPICard;