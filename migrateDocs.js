
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import fs from 'fs';
import path from 'path';

// 1. Cargamos configuración desde .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.replace(/"/g, '').trim();
});

// 2. Configuración de Firebase
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// 3. Carpeta de archivos local
const ROOT_FOLDER = '/Users/ismar/Desktop/MisFacturas';

async function migrate() {
  console.log('--- INICIANDO MIGRACIÓN RECURSIVA ---');

  if (!fs.existsSync(ROOT_FOLDER)) {
    console.log(`❌ Error: La carpeta ${ROOT_FOLDER} no existe.`);
    return;
  }

  // Función para leer archivos recursivamente
  function getFiles(dir, allFiles = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const name = path.join(dir, file);
      if (fs.statSync(name).isDirectory()) {
        getFiles(name, allFiles);
      } else if (file.toLowerCase().endsWith('.pdf')) {
        // Guardamos el path y el nombre de la carpeta padre como ShipTo
        const parentFolder = path.basename(path.dirname(name));
        allFiles.push({ path: name, fileName: file, shipTo: parentFolder });
      }
    }
    return allFiles;
  }

  console.log('🔍 Escaneando subcarpetas...');
  const pdfList = getFiles(ROOT_FOLDER);

  if (pdfList.length === 0) {
    console.log('No se encontraron PDFs en ninguna subcarpeta.');
    return;
  }

  console.log(`✅ Se encontraron ${pdfList.length} archivos para migrar.`);

  let successCount = 0;
  for (let i = 0; i < pdfList.length; i++) {
    const fileInfo = pdfList[i];
    try {
      console.log(`[${i + 1}/${pdfList.length}] Subiendo: ${fileInfo.shipTo} -> ${fileInfo.fileName}...`);
      
      const fileBuffer = fs.readFileSync(fileInfo.path);
      const fileNameNoExt = fileInfo.fileName.replace('.pdf', '');
      // Intentamos separar por guion bajo, guion medio o espacio y tomamos la última parte
      const nameParts = fileNameNoExt.split(/[_\-\s]+/);
      const invoiceNo = nameParts[nameParts.length - 1] || fileNameNoExt;
      
      const shipTo = fileInfo.shipTo;
      const branchId = 'Sucursal_Houston';

      const storagePath = `invoices/${branchId}/${shipTo}/${invoiceNo}.pdf`;
      const storageRef = ref(storage, storagePath);

      // Subir a Firebase Storage
      await uploadBytes(storageRef, fileBuffer);
      const downloadUrl = await getDownloadURL(storageRef);

      // Guardar en Firestore
      const safeDocId = invoiceNo.replace(/[^a-z0-9]/gi, '_');
      const docRef = doc(db, 'invoices', safeDocId);
      
      await setDoc(docRef, {
        invoiceNo,
        shipTo,
        branchId,
        storagePath,
        downloadUrl,
        updatedAt: Timestamp.now(),
        fileName: fileInfo.fileName,
        source: 'Recursive_Local_Migration'
      }, { merge: true });

      successCount++;
    } catch (err) {
      console.error(` ❌ Error con ${fileInfo.fileName}:`, err.message);
    }
  }

  console.log('\n--- MIGRACIÓN FINALIZADA ---');
  console.log(`Éxito: ${successCount} de ${pdfList.length} archivos.`);
}

migrate();
