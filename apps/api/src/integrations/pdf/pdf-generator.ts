import puppeteer, { type Browser } from 'puppeteer';
import { logger } from '../../shared/logger/logger.js';

let browserCompartilhado: Browser | null = null;

async function obterBrowser(): Promise<Browser> {
  if (browserCompartilhado && browserCompartilhado.connected) {
    return browserCompartilhado;
  }
  browserCompartilhado = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH ?? undefined,
  });
  return browserCompartilhado;
}

export async function renderizarPdf(html: string): Promise<Buffer> {
  const browser = await obterBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

export async function encerrarBrowserPdf(): Promise<void> {
  if (browserCompartilhado) {
    try {
      await browserCompartilhado.close();
    } catch (erro) {
      logger.warn('Falha ao encerrar browser Puppeteer', { erro });
    }
    browserCompartilhado = null;
  }
}
