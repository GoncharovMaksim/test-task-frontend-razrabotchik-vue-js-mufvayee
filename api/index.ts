import { createApp } from '../server/app'

const app = createApp()

export default function handler(req: unknown, res: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (app as any)(req, res)
}
