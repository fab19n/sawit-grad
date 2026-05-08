import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { GradingRecord } from '../types/grading';
import { MILL_NAME } from '../constants/theme';

function fmt(v: any): string {
  if (v === null || v === undefined || v === '') return '—';
  return String(v);
}
function fmtD(d: string): string {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y.slice(2)}`;
}

export async function shareTicketPDF(rec: GradingRecord): Promise<void> {
  const html = buildHTML(rec);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Tiket Penggredan #${rec.id}`,
    UTI: 'com.adobe.pdf',
  });
}

function row(label: string, value: string, shade = false): string {
  return `<tr style="background:${shade ? '#FBF8EE' : '#FFFEF8'}">
    <td class="lbl">${label}</td>
    <td class="val">${value}</td>
  </tr>`;
}

function gradeRow(label: string, bil: number, pct: number, pen: number, shade = false): string {
  return `<tr style="background:${shade ? '#FBF8EE' : '#FFFEF8'}">
    <td class="glbl">${label}</td>
    <td class="gval">${bil || 0}</td>
    <td class="gval">${pct || 0}</td>
    <td class="gval">${pen?.toFixed(2) ?? '0.00'}</td>
  </tr>`;
}

function totRow(label: string, bil: number, pct: number): string {
  return `<tr style="background:#F0E8B0">
    <td class="glbl" style="font-weight:700">${label}</td>
    <td class="gval" style="font-weight:700">${bil || 0}</td>
    <td class="gval" style="font-weight:700">${pct || 0}</td>
    <td class="gval">—</td>
  </tr>`;
}

function buildHTML(r: GradingRecord): string {
  const ts = new Date().toLocaleDateString('ms-MY') + ' ' +
    new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; width: 100%; background: #fff; }
  .header { background: #2B2200; padding: 14px; text-align: center; }
  .header .mill { color: #F0D96A; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .header .form { color: #fff; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }
  .sno-wrap { background: #C49A0A; margin: 10px auto; display: inline-block; padding: 7px 22px; border-radius: 6px; }
  .sno-center { text-align: center; margin: 10px 0; }
  .sno { color: #2B2200; font-size: 20px; font-weight: 700; letter-spacing: 3px; font-family: monospace; }
  .dt-row { display: flex; border-bottom: 1px solid #E8D48A; }
  .dt-cell { flex: 1; padding: 8px 12px; border-right: 1px solid #E8D48A; }
  .dt-cell:last-child { border-right: none; }
  .dt-lbl { font-size: 8px; font-weight: 700; color: #6B5C2E; text-transform: uppercase; margin-bottom: 3px; }
  .dt-val { font-size: 14px; font-weight: 700; color: #2B2200; }
  table { width: 100%; border-collapse: collapse; }
  .lbl { font-size: 9px; font-weight: 700; color: #6B5C2E; text-transform: uppercase; padding: 8px 12px; width: 45%; border-bottom: 1px solid #EDE4C0; }
  .val { font-size: 12px; font-weight: 700; color: #2B2200; text-align: right; padding: 8px 12px; border-bottom: 1px solid #EDE4C0; }
  .sec-hd { background: #2B2200; color: #F0D96A; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 7px 12px; }
  .sec-hd.mid { background: #4A3A00; }
  .gt-head { background: #F5EFD6; }
  .gt-head td { font-size: 8px; font-weight: 700; color: #4A3A00; text-transform: uppercase; padding: 5px 8px; text-align: center; border-bottom: 1px solid #C49A0A; }
  .gt-head td:first-child { text-align: left; }
  .glbl { font-size: 11px; font-weight: 700; color: #2B2200; padding: 7px 8px; border-bottom: 1px solid #EDE4C0; width: 45%; }
  .gval { font-size: 12px; font-weight: 700; color: #2B2200; text-align: center; padding: 7px 8px; border-bottom: 1px solid #EDE4C0; }
  .grand { background: #2B2200; }
  .grand td { color: #F0D96A; font-size: 12px; font-weight: 700; padding: 8px; text-align: center; }
  .grand td:first-child { text-align: left; }
  .notes-wrap { padding: 10px 12px; border-bottom: 1px solid #E8D48A; }
  .notes-lbl { font-size: 8px; font-weight: 700; color: #6B5C2E; text-transform: uppercase; margin-bottom: 4px; }
  .notes-val { font-size: 12px; font-style: italic; color: #2B2200; }
  .sig-row { display: flex; padding: 10px 12px; gap: 12px; }
  .sig-cell { flex: 1; }
  .sig-lbl { font-size: 8px; font-weight: 700; color: #6B5C2E; text-transform: uppercase; margin-bottom: 3px; }
  .sig-val { font-size: 13px; font-weight: 700; color: #2B2200; }
  .footer { background: #2B2200; padding: 6px; text-align: center; margin-top: 10px; }
  .footer p { color: rgba(240,217,106,0.7); font-size: 8px; }
</style>
</head>
<body>

<div class="header">
  <div class="mill">${MILL_NAME}</div>
  <div class="form">Borang Penggredan</div>
</div>

<div class="sno-center">
  <div class="sno-wrap"><span class="sno">#${r.id}</span></div>
</div>

<div class="dt-row">
  <div class="dt-cell"><div class="dt-lbl">Tarikh</div><div class="dt-val">${fmtD(r.date)}</div></div>
  <div class="dt-cell"><div class="dt-lbl">Masa</div><div class="dt-val">${r.time || '—'}</div></div>
</div>

<table>
  ${row('Nama Pembekal',        fmt(r.namaLesen))}
  ${row('No. Lesen MPOB',       fmt(r.noLesenMPOB),      true)}
  ${row('No. Kenderaan',        fmt(r.noKenderaan))}
  ${row('No. Tiket Timbang',    fmt(r.noTiketTimbang),   true)}
  ${row('Bilangan Sampel',      fmt(r.bilanganSampel))}
  ${row('Berat Bersih (KG)',    fmt(r.beratBersih),      true)}
  ${row('Purata Berat Tandan',  fmt(r.purataBerat)+' KG')}
  ${row('BOER',                 fmt(r.boer)+' %',        true)}
  ${row('BKER',                 fmt(r.bker)+' %')}
  ${row('GOER',                 fmt(r.goer),             true)}
</table>

<div class="sec-hd">Muatan Basah / Tandan Tidak Segar</div>
<table>
  <tr class="gt-head">
    <td>Penggredan</td><td>Bil.</td><td>%</td><td>Penalti</td>
  </tr>
  ${gradeRow('(1) Tandan Masak',   r.tandanMasak?.bil,   r.tandanMasak?.pct,   r.tandanMasak?.penalti)}
  ${gradeRow('(2) Tandan Mengkal', r.tandanMengkal?.bil, r.tandanMengkal?.pct, r.tandanMengkal?.penalti, true)}
  ${gradeRow('(3) Tandan Busuk',   r.tandanBusuk?.bil,   r.tandanBusuk?.pct,   r.tandanBusuk?.penalti)}
  ${gradeRow('(4) Tandan Kosong',  r.tandanKosong?.bil,  r.tandanKosong?.pct,  r.tandanKosong?.penalti, true)}
  ${totRow('JUMLAH (B)', r.jumlahB?.bil, r.jumlahB?.pct)}
</table>

<div class="sec-hd mid">Kualiti Tandan</div>
<table>
  <tr class="gt-head">
    <td>Penggredan</td><td>Bil.</td><td>%</td><td>Penalti</td>
  </tr>
  ${gradeRow('(1) Tandan Kotor',       r.tandanKotor?.bil,   r.tandanKotor?.pct,   r.tandanKotor?.penalti)}
  ${gradeRow('(2) Tandan Lama',        r.tandanLama?.bil,    r.tandanLama?.pct,    r.tandanLama?.penalti,    true)}
  ${gradeRow('(3) Tandan Dura',        r.tandanDura?.bil,    r.tandanDura?.pct,    r.tandanDura?.penalti)}
  ${gradeRow('(4) Tangkai Panjang',    r.tandanTangkai?.bil, r.tandanTangkai?.pct, r.tandanTangkai?.penalti, true)}
  ${gradeRow('(5) Partenokarpi',       r.partenokarpi?.bil,  r.partenokarpi?.pct,  r.partenokarpi?.penalti)}
  ${totRow('JUMLAH (C)', r.jumlahC?.bil, r.jumlahC?.pct)}
  <tr class="grand">
    <td>JUMLAH BESAR (A+B+C)</td>
    <td>${r.jumlahBesar?.bil || 0}</td>
    <td>${r.jumlahBesar?.pct || 0}</td>
    <td>—</td>
  </tr>
</table>

${r.catatan ? `
<div class="notes-wrap">
  <div class="notes-lbl">Catatan</div>
  <div class="notes-val">${r.catatan}</div>
</div>` : ''}

<div class="sig-row">
  <div class="sig-cell">
    <div class="sig-lbl">Nama Penggred</div>
    <div class="sig-val">${fmt(r.namaPenggred)}</div>
  </div>
  <div class="sig-cell">
    <div class="sig-lbl">Pemandu / Pemilik</div>
    <div class="sig-val">${fmt(r.namaPemandu)}</div>
  </div>
</div>

<div class="footer"><p>Dijana oleh SawitGrad · ${ts}</p></div>
</body>
</html>`;
}