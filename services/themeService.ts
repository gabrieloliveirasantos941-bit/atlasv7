import JSZip from 'jszip';

export interface CustomTheme {
    id: string;
    name: string;
    version: string;
    author: string;
    css: string;
    backgroundUrl: string;
    backgroundType: 'image' | 'video';
}

export const extractTheme = async (file: File): Promise<CustomTheme> => {
    // Support for single CSS file as a theme
    if (file.name.endsWith('.css')) {
        const css = await file.text();
        return {
            id: `theme-${Date.now()}`,
            name: file.name.replace('.css', ''),
            version: '1.0.0',
            author: 'Usuário',
            css,
            backgroundUrl: '',
            backgroundType: 'image'
        };
    }

    const zip = new JSZip();
    let contents;
    try {
        contents = await zip.loadAsync(file);
    } catch (err: any) {
        if (err.message.includes('Can\'t find end of central directory')) {
            throw new Error('O arquivo enviado não é um arquivo .zip válido ou está corrompido. Certifique-se de que o tema esteja compactado corretamente.');
        }
        throw new Error(`Erro ao ler o arquivo: ${err.message}`);
    }
    
    // 1. Validate manifest.json
    const manifestFile = contents.file('manifest.json');
    if (!manifestFile) throw new Error('manifest.json não encontrado no tema. O arquivo .zip deve conter um manifest.json.');
    
    const manifestContent = await manifestFile.async('string');
    let manifest;
    try {
        manifest = JSON.parse(manifestContent);
    } catch (e) {
        throw new Error('O arquivo manifest.json contém um erro de sintaxe JSON.');
    }
    
    if (manifest.type !== 'atlas-theme') {
        throw new Error('O arquivo não é um tema válido do Atlas IA (o tipo no manifest.json deve ser "atlas-theme").');
    }

    // 2. Extract style.css
    const cssFile = contents.file('style.css');
    if (!cssFile) throw new Error('style.css não encontrado no tema.');
    const css = await cssFile.async('string');

    // 3. Extract background
    let backgroundUrl = '';
    let backgroundType: 'image' | 'video' = 'image';
    
    const bgJpg = contents.file('background.jpg');
    const bgPng = contents.file('background.png');
    const bgMp4 = contents.file('background.mp4');

    if (bgMp4) {
        const blob = await bgMp4.async('blob');
        backgroundUrl = URL.createObjectURL(blob);
        backgroundType = 'video';
    } else if (bgJpg || bgPng) {
        const bgFile = bgJpg || bgPng;
        const blob = await bgFile!.async('blob');
        backgroundUrl = URL.createObjectURL(blob);
        backgroundType = 'image';
    } else {
        // Background is optional for single CSS themes, but let's keep it required for ZIP themes for consistency
        // unless we want to allow themes without background.
        // Actually, let's make it optional.
        backgroundUrl = '';
    }

    return {
        id: `theme-${Date.now()}`,
        name: manifest.name || 'Tema Sem Nome',
        version: manifest.version || '1.0.0',
        author: manifest.author || 'Desconhecido',
        css,
        backgroundUrl,
        backgroundType
    };
};

export const applyCustomTheme = (theme: CustomTheme | null) => {
    // Remove existing custom style
    const existingStyle = document.getElementById('atlas-custom-theme-style');
    if (existingStyle) existingStyle.remove();

    if (!theme) {
        // Reset background
        document.body.style.backgroundImage = '';
        const bgVideo = document.getElementById('atlas-custom-bg-video');
        if (bgVideo) bgVideo.remove();
        document.documentElement.classList.remove('has-custom-theme');
        return;
    }

    // Apply CSS
    const style = document.createElement('style');
    style.id = 'atlas-custom-theme-style';
    style.textContent = theme.css;
    document.head.appendChild(style);

    // Apply Background
    const bgVideo = document.getElementById('atlas-custom-bg-video');
    if (bgVideo) bgVideo.remove();

    document.documentElement.classList.add('has-custom-theme');

    if (theme.backgroundType === 'video') {
        const video = document.createElement('video');
        video.id = 'atlas-custom-bg-video';
        video.src = theme.backgroundUrl;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.style.position = 'fixed';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.style.zIndex = '-1';
        video.style.pointerEvents = 'none';
        document.body.appendChild(video);
        document.body.style.backgroundImage = 'none';
    } else {
        document.body.style.backgroundImage = `url(${theme.backgroundUrl})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
    }
};
