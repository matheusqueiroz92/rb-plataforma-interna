import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import weekOfYear from 'dayjs/plugin/weekOfYear.js';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import 'dayjs/locale/pt-br.js';

import { FUSO_HORARIO } from '@rb/constants';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);
dayjs.locale('pt-br');

export function agoraBahia(): dayjs.Dayjs {
  return dayjs().tz(FUSO_HORARIO);
}

export function dataHojeBahia(): Date {
  return agoraBahia().startOf('day').toDate();
}

export function semanaReferencia(data: Date | string = new Date()): string {
  const d = dayjs(data).tz(FUSO_HORARIO);
  return `${d.isoWeekYear()}-W${String(d.isoWeek()).padStart(2, '0')}`;
}

export function formatarDataBR(data: Date | string): string {
  return dayjs(data).tz(FUSO_HORARIO).format('DD/MM/YYYY');
}

export function formatarDataHoraBR(data: Date | string): string {
  return dayjs(data).tz(FUSO_HORARIO).format('DD/MM/YYYY HH:mm:ss');
}

export function formatarHoraBR(data: Date | string): string {
  return dayjs(data).tz(FUSO_HORARIO).format('HH:mm:ss');
}

export function diasDesde(data: Date | string): number {
  return agoraBahia().diff(dayjs(data).tz(FUSO_HORARIO), 'day');
}
