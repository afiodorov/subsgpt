export function uploadAndStoreFile(setText: (text: string) => void): void {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".srt";
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const fileContent = loadEvent.target?.result;
        if (typeof fileContent === "string") {
          setText(fileContent);
          localStorage.setItem("uploadedFile", fileContent);
        }
      };
      reader.readAsText(file);
    }
  };

  input.click();
}
