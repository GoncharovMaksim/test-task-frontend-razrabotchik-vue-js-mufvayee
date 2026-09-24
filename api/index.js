import { createApp } from '../server/app';
const app = createApp();
export default function handler(req, res) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return app(req, res);
}
