/**
 * Zapisuje `Blob` jako plik. Element `<a>` jest dołączany do DOM (wymagane w części
 * przeglądarek, m.in. Firefox), a `revokeObjectURL` odroczony, aby nie zerwać pobierania.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}
