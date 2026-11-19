import { describe, expect, it } from 'vitest'
import { createQueue } from '../../src/lib/queue'

const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms))

describe('createQueue', () => {
  it('never exceeds the concurrency limit', async () => {
    const q = createQueue(2)
    let running = 0
    let peak = 0
    const task = async () => {
      running++
      peak = Math.max(peak, running)
      await tick()
      running--
    }
    await Promise.all(Array.from({ length: 7 }, () => q.push(task)))
    expect(peak).toBe(2)
    expect(q.active).toBe(0)
    expect(q.size).toBe(0)
  })

  it('a failing task does not stop the rest', async () => {
    const q = createQueue(1)
    const done: number[] = []
    await Promise.all([
      q.push(async () => {
        throw new Error('boom')
      }),
      q.push(async () => {
        done.push(2)
      }),
      q.push(async () => {
        done.push(3)
      }),
    ])
    expect(done).toEqual([2, 3])
  })

  it('starts tasks in FIFO order', async () => {
    const q = createQueue(1)
    const order: number[] = []
    await Promise.all([1, 2, 3].map((n) => q.push(async () => void order.push(n))))
    expect(order).toEqual([1, 2, 3])
  })

  it('rejects invalid limit', () => {
    expect(() => createQueue(0)).toThrow()
  })
})
