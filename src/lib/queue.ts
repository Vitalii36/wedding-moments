/** Minimal concurrency-limited task runner. Tasks are started FIFO; a failing task never stops others. */
export type Task = () => Promise<unknown>

export function createQueue(limit: number) {
  if (limit < 1) throw new Error('limit must be >= 1')
  const pending: Array<{ task: Task; resolve: () => void }> = []
  let active = 0

  function pump() {
    while (active < limit && pending.length > 0) {
      const { task, resolve } = pending.shift()!
      active++
      Promise.resolve()
        .then(task)
        .catch(() => {
          /* errors are surfaced by the task itself */
        })
        .finally(() => {
          active--
          resolve()
          pump()
        })
    }
  }

  return {
    /** Enqueue a task; the returned promise settles (never rejects) when the task finishes. */
    push(task: Task): Promise<void> {
      return new Promise<void>((resolve) => {
        pending.push({ task, resolve })
        pump()
      })
    },
    get active() {
      return active
    },
    get size() {
      return pending.length
    },
  }
}
