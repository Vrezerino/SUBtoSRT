#SUB to SRT Converter

A SUB file is a MicroDVD subtitle file. It looks something like this:

        {1}{1}25.000
        {950}{1033}- What does he want?|- I'll find out.
        {1056}{1154}You don't have to take orders|from this man, you know.
        {1157}{1216}Well, I'm the liaison officer.|So I'm liaising.

        ...


<p>
The first line of the file is reserved for telling the media player how many frames per second, FPS, is displayed in the video. Sometimes, like in this case, the number is wrong; Merry Christmas Mr. Lawrence (1983) actually runs at 23.98 frames per second, so when the subtitle is uploaded and the above FPS field is populated by the FPS, you can then change it. By inspecting file properties you can usually find out what the framerate in your movie file is.
</p>

<p>
The subsequent lines contain frame timecodes, not hour, minute, second and millisecond codes like SRT files do. The number inside first curly braces is the frame at which the line appears and the second curly braces contain the frame at which the line disappears.
</p>

<p>
By using this tool you can convert the subtitles, but also shift the subtitles by milliseconds, back or forth (negative or positive number), if the subtitles don't linearly line up with movie content.
</p>
