export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  description?: string;
}

export interface DriveFolderInfo {
  id: string;
  name: string;
}

export class DriveService {
  private static BASE_URL = 'https://www.googleapis.com/drive/v3';

  /**
   * List files within a specific folder or root
   */
  static async listFiles(folderId: string, accessToken: string): Promise<DriveFileItem[]> {
    // If folderId is provided, search inside that parent folder
    let query = 'trashed = false';
    if (folderId && folderId.trim().length > 0) {
      const cleanId = folderId.trim();
      query += ` and '${cleanId}' in parents`;
    }

    const params = new URLSearchParams({
      q: query,
      fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink, iconLink, description)',
      pageSize: '100',
      orderBy: 'folder,name',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    });

    const response = await fetch(`${this.BASE_URL}/files?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const rawMsg = errData.error?.message || '';

      if (rawMsg.includes('insufficient authentication scopes') || response.status === 403) {
        throw new Error(
          'Permissões insuficientes no Google Drive: O token da sua conta Google não incluiu o escopo de leitura de arquivos. Por favor, clique em "Reconectar Conta Google" e marque a caixa de seleção permitindo o acesso ao Google Drive.'
        );
      }

      throw new Error(
        rawMsg || `Erro ao carregar arquivos do Drive (${response.status}: ${response.statusText})`
      );
    }

    const data = await response.json();
    return data.files || [];
  }

  /**
   * Get metadata for a specific folder/file
   */
  static async getFileMetadata(fileId: string, accessToken: string): Promise<DriveFileItem> {
    const params = new URLSearchParams({
      fields: 'id, name, mimeType, size, modifiedTime, webViewLink, iconLink, description',
      supportsAllDrives: 'true',
    });

    const response = await fetch(`${this.BASE_URL}/files/${fileId}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Erro ao obter detalhes do arquivo (${response.status})`);
    }

    return await response.json();
  }

  /**
   * Download or export the contents of a file as string/text
   */
  static async getFileContent(fileId: string, mimeType: string, accessToken: string): Promise<string> {
    // Google Docs formats must be exported
    if (mimeType === 'application/vnd.google-apps.document') {
      const exportUrl = `${this.BASE_URL}/files/${fileId}/export?mimeType=text/plain`;
      const res = await fetch(exportUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Falha ao exportar documento do Google Docs.');
      return await res.text();
    }

    if (mimeType === 'application/vnd.google-apps.spreadsheet') {
      const exportUrl = `${this.BASE_URL}/files/${fileId}/export?mimeType=text/csv`;
      const res = await fetch(exportUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Falha ao exportar planilha do Google Sheets.');
      return await res.text();
    }

    if (mimeType === 'application/vnd.google-apps.presentation') {
      const exportUrl = `${this.BASE_URL}/files/${fileId}/export?mimeType=text/plain`;
      const res = await fetch(exportUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Falha ao exportar apresentação.');
      return await res.text();
    }

    // Binary / Standard text or json files
    const mediaUrl = `${this.BASE_URL}/files/${fileId}?alt=media&supportsAllDrives=true`;
    const res = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`Falha ao ler o conteúdo do arquivo (${res.status}: ${res.statusText})`);
    }

    return await res.text();
  }

  /**
   * Helper to extract folder ID from full Drive URL if pasted
   */
  static extractFolderId(inputUrlOrId: string): string {
    const trimmed = inputUrlOrId.trim();
    if (!trimmed) return '';

    // Matches /folders/([a-zA-Z0-9_-]+)
    const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch && folderMatch[1]) {
      return folderMatch[1];
    }

    // Matches id=([a-zA-Z0-9_-]+)
    const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return idMatch[1];
    }

    // If it's already an ID
    return trimmed;
  }
}
