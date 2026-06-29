import 'dotenv/config';

async function checkEmbeddings() {
    console.log("🔍 Consultando a Google por modelos de Embeddings...");
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        
        // Aquí está la corrección: le decimos a TypeScript que confíe en nosotros
        const data: any = await res.json(); 
        
        if (data.error) {
            console.error("❌ Error de la API:", data.error.message);
            return;
        }

        const embeddings = data.models.filter((m: any) => 
            m.supportedGenerationMethods && m.supportedGenerationMethods.includes('embedContent')
        );

        if (embeddings.length === 0) {
            console.log("⚠️ Tu API Key no tiene acceso a NINGÚN modelo de embeddings actualmente.");
        } else {
            console.log("✅ Modelos de Embedding permitidos:");
            embeddings.forEach((m: any) => console.log(` - ${m.name}`));
        }
    } catch (error) {
        console.error("❌ Error de red:", error);
    }
}

checkEmbeddings();