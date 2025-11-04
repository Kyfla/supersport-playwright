import { test, expect } from '@playwright/test';

test('Test izračuna kladioničkog listića', async ({ page }) => {
  console.log('Otvaram supersport.hr...');
  await page.goto('https://www.supersport.hr');
  
  try {
    await page.click('button:has-text("Prihvati")', { timeout: 3000 });
    console.log('Kolačići prihvaćeni');
  } catch (e) {
    console.log('Nema kolačića za prihvatiti');
  }
  
  await page.waitForTimeout(2000);
  
  console.log('Idem na Sport sekciju...');
  await page.click('a[href="/sport"]');
  await page.waitForTimeout(3000);
  console.log('Sport stranica učitana\n');
  
  console.log('Tražim kvote...');
  
  const sviElementi = await page.getByText(/^\d+[.,]\d{1,2}$/).all();
  console.log(`Pronađeno ${sviElementi.length} elemenata sa brojevima`);
  
  const validneKvote = [];
  for (const element of sviElementi) {
    try {
      const tekst = await element.textContent();
      const broj = parseFloat(tekst.replace(',', '.'));
      
      if (broj >= 1.01 && broj <= 100) {
        const isVisible = await element.isVisible();
        if (isVisible) {
          validneKvote.push(element);
        }
      }
    } catch (e) {
    }
  }
  
  console.log(`Pronađeno ${validneKvote.length} validnih kvota\n`);
  
  const brojOklada = 3;
  const odabraneOklade = [];
  const iskoristeniIndeksi = [];
  
  for (let i = 0; i < brojOklada; i++) {
    let nasumicniIndeks;
    do {
      nasumicniIndeks = Math.floor(Math.random() * validneKvote.length);
    } while (iskoristeniIndeksi.includes(nasumicniIndeks));
    
    iskoristeniIndeksi.push(nasumicniIndeks);
    
    const tekstKvote = await validneKvote[nasumicniIndeks].textContent();
    const vrijednostKvote = parseFloat(tekstKvote.trim().replace(',', '.'));
    
    await validneKvote[nasumicniIndeks].click();
    await page.waitForTimeout(800);
    
    odabraneOklade.push(vrijednostKvote);
    console.log(`Oklada ${i + 1}: ${vrijednostKvote}`);
  }
  
  let ukupnaKvota = 1;
  for (let i = 0; i < odabraneOklade.length; i++) {
    ukupnaKvota = ukupnaKvota * odabraneOklade[i];
  }
  console.log(`\nUkupna kvota izračunata: ${ukupnaKvota.toFixed(2)}`);
  
  console.log('Provjeravam betting slip...');
  await page.waitForTimeout(2000);
  
  try {
    const betslipButton = page.locator('[class*="betslip"], [class*="bet-slip"], [class*="ticket"]').first();
    const isVisible = await betslipButton.isVisible({ timeout: 2000 });
    if (isVisible) {
      await betslipButton.click();
      await page.waitForTimeout(1000);
      console.log('Betting slip otvoren');
    }
  } catch (e) {
    console.log('Betting slip već otvoren ili nije potrebno otvarati');
  }

  const ulog = 50;
  console.log(`Unosim ulog: ${ulog}`);
  
  let inputPolje = null;
  const inputSelektori = [
    'input[type="number"]',
    'input[type="text"]',
    'input[placeholder*="ulog"]',
    'input[placeholder*="Ulog"]',
    'input[name*="stake"]',
    'input'
  ];
  
  for (const selektor of inputSelektori) {
    try {
      const input = page.locator(selektor).first();
      const isVisible = await input.isVisible({ timeout: 2000 });
      if (isVisible) {
        inputPolje = input;
        console.log(`Pronađen input: ${selektor}`);
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!inputPolje) {
    console.log('Input polje nije pronađeno, nastavljam sa provjerom kvota...');

  } else {
    await inputPolje.click();
    await inputPolje.clear();
    await inputPolje.fill(ulog.toString());
    await page.waitForTimeout(1500);
    console.log(`Ulog unesen: ${ulog}`);
  }
  
  const ocekivaniDobitak = ulog * ukupnaKvota;
  console.log(`Očekivani dobitak: ${ocekivaniDobitak.toFixed(2)}`);
  
  const sviBrojevi = await page.getByText(/\d+[.,]\d{2}/).all();
  
  let prikazaniDobitak = 0;
  let prikazanaKvota = 0;
  
  for (const element of sviBrojevi) {
    const tekst = await element.textContent();
    const broj = parseFloat(tekst.replace(',', '.'));
    
    if (broj > 1 && broj < 1000 && Math.abs(broj - ukupnaKvota) < 0.1) {
      prikazanaKvota = broj;
      console.log(`Prikazana ukupna kvota: ${prikazanaKvota.toFixed(2)}`);
    }
    
    if (broj > ulog && Math.abs(broj - ocekivaniDobitak) < 5) {
      prikazaniDobitak = broj;
      console.log(`Prikazani dobitak: ${prikazaniDobitak.toFixed(2)}`);
    }
  }
  
  console.log(`\n== REZULTAT ==`);
  console.log(`Odabrane kvote: ${odabraneOklade.map(k => k.toFixed(2)).join(' x ')}`);
  console.log(`Izračunata ukupna kvota: ${ukupnaKvota.toFixed(2)}`);
  console.log(`Prikazana ukupna kvota: ${prikazanaKvota.toFixed(2)}`);
  console.log(`Ulog: ${ulog}`);
  console.log(`Izračunati dobitak: ${ocekivaniDobitak.toFixed(2)}`);
  console.log(`Prikazani dobitak: ${prikazaniDobitak.toFixed(2)}`);
  
  if (prikazanaKvota > 0) {
    const razlikaKvota = Math.abs(ukupnaKvota - prikazanaKvota);
    console.log(`Razlika u kvoti: ${razlikaKvota.toFixed(4)}`);
    expect(razlikaKvota).toBeLessThan(0.01);
    console.log('Kvota se podudara!');
  }
  
  if (prikazaniDobitak > 0) {
    const razlikaDobitak = Math.abs(ocekivaniDobitak - prikazaniDobitak);
    console.log(`Razlika u dobitku: ${razlikaDobitak.toFixed(2)}`);
    expect(razlikaDobitak).toBeLessThan(1);
    console.log('Dobitak se podudara!');
  }
  
  expect(prikazanaKvota > 0 || prikazaniDobitak > 0).toBeTruthy();
  
  console.log('\nTEST PROŠAO!');
});