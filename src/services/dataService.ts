import Papa from 'papaparse';

export interface Gallery {
  name: string;
  district: string;
  address: string;
  phone: string;
  workingHours: string;
  image: string;
}

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1lhFmABYGZdFGIDJeAZUbcG7WzZ-kT3VhlAqVmpKS3-8/export?format=csv';

export async function fetchGalleries(): Promise<Gallery[]> {
  try {
    const response = await fetch(SHEET_CSV_URL);
    const csvContent = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const galleries: Gallery[] = results.data.map((row: any) => ({
            name: row['Galeri Adı'] || '',
            district: row['İlçe Adı'] || '',
            address: row['Adres'] || '',
            phone: row['Telefon'] || '',
            workingHours: row['Çalışma Saatleri'] || '',
            image: row['Görsel'] || ''
          }));
          resolve(galleries);
        },
        error: (error: Error) => {
          reject(error);
        }
      });
    });
  } catch (err) {
    console.error("Failed to fetch Google Sheets CSV", err);
    return [];
  }
}
