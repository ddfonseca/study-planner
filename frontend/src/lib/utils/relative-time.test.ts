import { describe, it, expect, vi, beforeEach } from 'vitest'
import { formatRelativeTime, getTimeUnit, getUpdateInterval } from './relative-time'

describe('relative-time', () => {
  const SECOND = 1000
  const MINUTE = 60 * SECOND
  const HOUR = 60 * MINUTE
  const DAY = 24 * HOUR
  const WEEK = 7 * DAY
  const MONTH = 30 * DAY
  const YEAR = 365 * DAY

  describe('formatRelativeTime', () => {
    let baseDate: Date

    beforeEach(() => {
      baseDate = new Date('2024-01-15T12:00:00.000Z')
    })

    describe('past times', () => {
      it('returns "agora" for very recent times (< 5 seconds)', () => {
        const date = new Date(baseDate.getTime() - 3 * SECOND)
        expect(formatRelativeTime(date, baseDate)).toBe('agora')
      })

      it('returns seconds for times under a minute', () => {
        const date = new Date(baseDate.getTime() - 30 * SECOND)
        expect(formatRelativeTime(date, baseDate)).toBe('há 30s')
      })

      it('returns minutes for times under an hour', () => {
        const date = new Date(baseDate.getTime() - 5 * MINUTE)
        expect(formatRelativeTime(date, baseDate)).toBe('há 5 min')
      })

      it('returns "há 1 hora" for singular hour', () => {
        const date = new Date(baseDate.getTime() - 1 * HOUR)
        expect(formatRelativeTime(date, baseDate)).toBe('há 1 hora')
      })

      it('returns hours for times under a day', () => {
        const date = new Date(baseDate.getTime() - 5 * HOUR)
        expect(formatRelativeTime(date, baseDate)).toBe('há 5 horas')
      })

      it('returns "há 1 dia" for singular day', () => {
        const date = new Date(baseDate.getTime() - 1 * DAY)
        expect(formatRelativeTime(date, baseDate)).toBe('há 1 dia')
      })

      it('returns days for times under a week', () => {
        const date = new Date(baseDate.getTime() - 3 * DAY)
        expect(formatRelativeTime(date, baseDate)).toBe('há 3 dias')
      })

      it('returns "há 1 semana" for singular week', () => {
        const date = new Date(baseDate.getTime() - 1 * WEEK)
        expect(formatRelativeTime(date, baseDate)).toBe('há 1 semana')
      })

      it('returns weeks for times under a month', () => {
        const date = new Date(baseDate.getTime() - 2 * WEEK)
        expect(formatRelativeTime(date, baseDate)).toBe('há 2 semanas')
      })

      it('returns "há 1 mês" for singular month', () => {
        const date = new Date(baseDate.getTime() - 1 * MONTH)
        expect(formatRelativeTime(date, baseDate)).toBe('há 1 mês')
      })

      it('returns months for times under a year', () => {
        const date = new Date(baseDate.getTime() - 6 * MONTH)
        expect(formatRelativeTime(date, baseDate)).toBe('há 6 meses')
      })

      it('returns "há 1 ano" for singular year', () => {
        const date = new Date(baseDate.getTime() - 1 * YEAR)
        expect(formatRelativeTime(date, baseDate)).toBe('há 1 ano')
      })

      it('returns years for times over a year', () => {
        const date = new Date(baseDate.getTime() - 3 * YEAR)
        expect(formatRelativeTime(date, baseDate)).toBe('há 3 anos')
      })
    })

    describe('future times', () => {
      it('returns "agora" for very near future times (< 5 seconds)', () => {
        const date = new Date(baseDate.getTime() + 3 * SECOND)
        expect(formatRelativeTime(date, baseDate)).toBe('agora')
      })

      it('returns seconds for future times under a minute', () => {
        const date = new Date(baseDate.getTime() + 30 * SECOND)
        expect(formatRelativeTime(date, baseDate)).toBe('em 30s')
      })

      it('returns minutes for future times under an hour', () => {
        const date = new Date(baseDate.getTime() + 5 * MINUTE)
        expect(formatRelativeTime(date, baseDate)).toBe('em 5 min')
      })

      it('returns "em 1 hora" for singular future hour', () => {
        const date = new Date(baseDate.getTime() + 1 * HOUR)
        expect(formatRelativeTime(date, baseDate)).toBe('em 1 hora')
      })

      it('returns hours for future times under a day', () => {
        const date = new Date(baseDate.getTime() + 5 * HOUR)
        expect(formatRelativeTime(date, baseDate)).toBe('em 5 horas')
      })

      it('returns "em 1 dia" for singular future day', () => {
        const date = new Date(baseDate.getTime() + 1 * DAY)
        expect(formatRelativeTime(date, baseDate)).toBe('em 1 dia')
      })

      it('returns days for future times under a week', () => {
        const date = new Date(baseDate.getTime() + 3 * DAY)
        expect(formatRelativeTime(date, baseDate)).toBe('em 3 dias')
      })

      it('returns "em 1 semana" for singular future week', () => {
        const date = new Date(baseDate.getTime() + 1 * WEEK)
        expect(formatRelativeTime(date, baseDate)).toBe('em 1 semana')
      })

      it('returns weeks for future times under a month', () => {
        const date = new Date(baseDate.getTime() + 2 * WEEK)
        expect(formatRelativeTime(date, baseDate)).toBe('em 2 semanas')
      })

      it('returns "em 1 mês" for singular future month', () => {
        const date = new Date(baseDate.getTime() + 1 * MONTH)
        expect(formatRelativeTime(date, baseDate)).toBe('em 1 mês')
      })

      it('returns months for future times under a year', () => {
        const date = new Date(baseDate.getTime() + 6 * MONTH)
        expect(formatRelativeTime(date, baseDate)).toBe('em 6 meses')
      })

      it('returns "em 1 ano" for singular future year', () => {
        const date = new Date(baseDate.getTime() + 1 * YEAR)
        expect(formatRelativeTime(date, baseDate)).toBe('em 1 ano')
      })

      it('returns years for future times over a year', () => {
        const date = new Date(baseDate.getTime() + 3 * YEAR)
        expect(formatRelativeTime(date, baseDate)).toBe('em 3 anos')
      })
    })

    describe('input types', () => {
      it('accepts Date object', () => {
        const date = new Date(baseDate.getTime() - 5 * MINUTE)
        expect(formatRelativeTime(date, baseDate)).toBe('há 5 min')
      })

      it('accepts timestamp number', () => {
        const timestamp = baseDate.getTime() - 5 * MINUTE
        expect(formatRelativeTime(timestamp, baseDate)).toBe('há 5 min')
      })

      it('accepts ISO string', () => {
        const isoString = new Date(baseDate.getTime() - 5 * MINUTE).toISOString()
        expect(formatRelativeTime(isoString, baseDate)).toBe('há 5 min')
      })

      it('uses current time as default base date', () => {
        vi.useFakeTimers()
        vi.setSystemTime(baseDate)

        const date = new Date(baseDate.getTime() - 5 * MINUTE)
        expect(formatRelativeTime(date)).toBe('há 5 min')

        vi.useRealTimers()
      })
    })
  })

  describe('getTimeUnit', () => {
    it('returns "second" for differences under a minute', () => {
      expect(getTimeUnit(30 * SECOND)).toBe('second')
      expect(getTimeUnit(-30 * SECOND)).toBe('second')
    })

    it('returns "minute" for differences under an hour', () => {
      expect(getTimeUnit(30 * MINUTE)).toBe('minute')
      expect(getTimeUnit(-30 * MINUTE)).toBe('minute')
    })

    it('returns "hour" for differences under a day', () => {
      expect(getTimeUnit(12 * HOUR)).toBe('hour')
      expect(getTimeUnit(-12 * HOUR)).toBe('hour')
    })

    it('returns "day" for differences under a week', () => {
      expect(getTimeUnit(3 * DAY)).toBe('day')
      expect(getTimeUnit(-3 * DAY)).toBe('day')
    })

    it('returns "week" for differences under a month', () => {
      expect(getTimeUnit(2 * WEEK)).toBe('week')
      expect(getTimeUnit(-2 * WEEK)).toBe('week')
    })

    it('returns "month" for differences under a year', () => {
      expect(getTimeUnit(6 * MONTH)).toBe('month')
      expect(getTimeUnit(-6 * MONTH)).toBe('month')
    })

    it('returns "year" for differences over a year', () => {
      expect(getTimeUnit(2 * YEAR)).toBe('year')
      expect(getTimeUnit(-2 * YEAR)).toBe('year')
    })
  })

  describe('getUpdateInterval', () => {
    let baseDate: Date

    beforeEach(() => {
      baseDate = new Date('2024-01-15T12:00:00.000Z')
    })

    it('returns 1 second for differences under a minute', () => {
      const date = new Date(baseDate.getTime() - 30 * SECOND)
      expect(getUpdateInterval(date, baseDate)).toBe(SECOND)
    })

    it('returns 1 minute for differences under an hour', () => {
      const date = new Date(baseDate.getTime() - 30 * MINUTE)
      expect(getUpdateInterval(date, baseDate)).toBe(MINUTE)
    })

    it('returns 5 minutes for differences under a day', () => {
      const date = new Date(baseDate.getTime() - 12 * HOUR)
      expect(getUpdateInterval(date, baseDate)).toBe(5 * MINUTE)
    })

    it('returns 1 hour for differences over a day', () => {
      const date = new Date(baseDate.getTime() - 3 * DAY)
      expect(getUpdateInterval(date, baseDate)).toBe(HOUR)
    })

    it('handles future dates', () => {
      const date = new Date(baseDate.getTime() + 30 * SECOND)
      expect(getUpdateInterval(date, baseDate)).toBe(SECOND)
    })

    it('accepts timestamp number', () => {
      const timestamp = baseDate.getTime() - 30 * MINUTE
      expect(getUpdateInterval(timestamp, baseDate)).toBe(MINUTE)
    })

    it('accepts ISO string', () => {
      const isoString = new Date(baseDate.getTime() - 30 * MINUTE).toISOString()
      expect(getUpdateInterval(isoString, baseDate)).toBe(MINUTE)
    })
  })
})
