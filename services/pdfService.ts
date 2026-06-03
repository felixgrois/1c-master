import * as pdfjs from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Try to use the local worker first, but set it up so it can fallback or use a stable version
const PDFJS_VERSION = '5.5.207';
try {
  // Use a CDN as a primary or fallback to ensure it works in all environments
  // especially when Vite's ?url might produce relative paths that fail in some iframe contexts
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
} catch (e) {
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export const extractTextFromPdf = async (file: File, onProgress?: (current: number, total: number) => void): Promise<string> => {
  console.log("Начало извлечения текста из PDF:", file.name);
  const arrayBuffer = await file.arrayBuffer();
  try {
    const loadingTask = pdfjs.getDocument({ 
      data: arrayBuffer,
    });
    
    const pdf = await loadingTask.promise;
    let fullText = '';
    const totalPages = pdf.numPages;
    console.log(`PDF загружен, всего страниц: ${totalPages}`);

    for (let i = 1; i <= totalPages; i++) {
      if (onProgress) onProgress(i, totalPages);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => {
          if ('str' in item) return item.str;
          return '';
        })
        .join(' ');
      fullText += pageText + '\n\n';
    }

    console.log(`Извлечение завершено, длина текста: ${fullText.length}`);
    return fullText.trim();
  } catch (error) {
    console.error("Ошибка при извлечении текста из PDF:", error);
    
    // Если это ошибка воркера, предоставляем более информативное сообщение
    if (error instanceof Error && (error.message.includes('worker') || error.message.includes('fetch'))) {
      throw new Error(`Ошибка загрузки обработчика PDF (Worker). Пожалуйста, проверьте интернет-соединение или попробуйте другой браузер. Подробности: ${error.message}`);
    }
    
    throw error;
  }
};
