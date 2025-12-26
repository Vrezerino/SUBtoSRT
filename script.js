const acceptedFileExtensions = ['sub', 'txt'];
const acceptedFileTypes = ['text/plain'];
const fileInput = document.getElementById('fileInput');
const messageDiv = document.getElementById('message');

fileInput.addEventListener('change', function () {
  const file = fileInput.files[0];
  if (file) {
    isTextFile(file)
      .then((result) => {
        if (result === 'text') {
          displayFileName();
        } else {
          setMessage('Not an actual SUB/TXT file.');
        }
      })
      .catch((error) => {
        setMessage(`Read error: ${error}`);
      });
  }
});

function displayFileName() {
  const fileInput = document.getElementById('fileInput');
  const fileName =
    fileInput.files.length > 0 ? fileInput.files[0].name : 'No file selected';

  const fileNameDisplay = document.getElementById('fileName');
  fileNameDisplay.textContent = fileName;

  // Automatically extract and set FPS
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function () {
      const lines = reader.result.split(/\r?\n/);
      if (lines.length > 0) {
        const firstLine = lines[0];
        const fps = extractFpsFromLine(firstLine);
        if (fps) {
          document.getElementById('fpsInput').value = fps;
        }
      }
    };

    reader.readAsText(file);
  }
}

function convert() {
  const fileInput = document.getElementById('fileInput');
  const shiftInput = document.getElementById('shiftInput');
  const fpsInput = document.getElementById('fpsInput');
  const fileExtension = fileInput.files[0].name.split('.').pop().toLowerCase();

  if (!acceptedFileExtensions.includes(fileExtension)) {
    setMessage('Please select a valid .sub file.');
    return;
  }

  if (!fileInput.files.length) {
    setMessage('The file contains no lines to process.');
    return;
  }

  // Only now accept file
  const file = fileInput.files[0];
  const reader = new FileReader();

  // Read the file when it's fully loaded
  reader.onload = function () {
    const lines = reader.result.split(/\r?\n/);

    if (lines.length < 2 || lines[0].trim() === '') {
      setMessage('There are no lines in this file whatsoever.');
      return;
    }

    const shift = parseInt(shiftInput.value) || 0;
    const userFps = parseFloat(fpsInput.value);

    // Validate shift value
    if (shift < -30000000 || shift > 30000000) {
      setMessage(`${shift} seems excessive.`);
      return;
    }

    // Validate FPS value
    if (userFps < 1 || userFps > 1000) {
      setMessage('Nonsensical frame rate.');
      return;
    }

    // Use user-provided fps or extract it from first line
    const fps = userFps || extractFpsFromLine(lines[0]);
    if (!fps) {
      setMessage('Framerate not found or invalid.');
      return;
    }

    let srtIndex = 1;
    let srtOutput = '';

    // Process the subtitle lines and convert them to hh:mm:ss:ms
    for (let i = 1; i < lines.length; i++) {
      const match = lines[i].match(/^\{(\d+)\}\{(\d+)\}(.*)$/);
      if (!match) continue;

      const startFrame = parseInt(match[1]);
      const endFrame = parseInt(match[2]);
      const text = match[3].replace(/\|/g, '\n');

      const startTime = frameToTime(startFrame, fps, shift);
      const endTime = frameToTime(endFrame, fps, shift);

      srtOutput +=
        srtIndex++ +
        '\n' +
        startTime +
        ' --> ' +
        endTime +
        '\n' +
        text +
        '\n\n';
    }

    // Trigger download of newly-created srt file
    downloadFile(srtOutput, file.name.replace(/\.sub$/i, '.srt'));

    // Show success message
    messageDiv.style.display = 'inline';
    setTimeout(function () {
      messageDiv.style.display = 'none';
    }, 5000);
  };

  reader.onerror = function () {
    setMessage('There was an error reading the file.');
  };

  // Read the file as text
  reader.readAsText(file);
}

/*
  Non-text files contain at least some non-readable data like binary.
  It's difficult to get the correct mimetype text/plain from text files
  so we'll use this instead of relying on the mimetype.
*/
function isTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (event) {
      const text = event.target.result;
      let nonTextCount = 0;

      const maxBytesToCheck = Math.min(text.length, 100);

      // Allow printable chars and \n, \r, tab, space, etc
      for (let i = 0; i < maxBytesToCheck; i++) {
        const charCode = text.charCodeAt(i);

        if (
          (charCode < 32 || charCode > 126) && // Not printable i.e. outside the standard ASCII range
          charCode !== 10 && // Allow newline \n
          charCode !== 13 && // Allow carriage return \r
          charCode !== 9 // Allow tab \t
        ) {
          nonTextCount++;
        }
      }

      // 5% of the first 100 characters are non-printable = treat it as binary
      if (nonTextCount / maxBytesToCheck > 0.05) {
        resolve('binary');
      } else {
        resolve('text');
      }
    };

    reader.onerror = function () {
      reject(new Error('Error reading file.'));
    };

    reader.readAsText(file);
  });
}

// Extract FPS from the first line if available
function extractFpsFromLine(line) {
  const fpsMatch = line.match(/\{1\}\{1\}([\d.]+)/);
  return fpsMatch ? parseFloat(fpsMatch[1]) : null;
}

// {n}{n} to hh:mm:ss:ms
function frameToTime(frame, fps, shift) {
  const totalMs = Math.round((frame / fps) * 1000) + shift;

  const ms = totalMs % 1000;
  const totalSec = Math.floor(totalMs / 1000);
  const sec = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const min = totalMin % 60;
  const hr = Math.floor(totalMin / 60);

  return (
    String(hr).padStart(2, '0') +
    ':' +
    String(min).padStart(2, '0') +
    ':' +
    String(sec).padStart(2, '0') +
    ',' +
    String(ms).padStart(3, '0')
  );
}

function downloadFile(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

function setMessage(text) {
  messageDiv.textContent = text;
  setTimeout(() => {
    messageDiv.textContent = '';
  }, 5000);
}
