module.exports = {
    // Generate timestamp now: if full argument is false/undefined,
    // timestamp is divided by 1000 to generate linux-length timestamp
    timestamp: function(full) {
        let date = new Date();
        let timestamp = date.getTime();
        return full ? Math.floor(timestamp) : Math.floor(timestamp / 1000);
    },

    // Converts string "16:30:02" to "4:30:02PM"
    military_to_standard: function(time) {
        time = time.split(':'); // convert to array
        let hours = Number(time[0]);
        let minutes = Number(time[1]);
        let seconds = Number(time[2]);
        let timeValue;
        if (hours > 0 && hours <= 12) { timeValue= "" + hours; } else if (hours > 12) { timeValue= "" + (hours - 12); } else if (hours == 0) { timeValue= "12"; }
        timeValue += (minutes < 10) ? ":0" + minutes : ":" + minutes;  // get minutes
        timeValue += (seconds < 10) ? ":0" + seconds : ":" + seconds;  // get seconds
        timeValue += (hours >= 12) ? " PM" : " AM";  // get AM/PM
        return timeValue;
    },

    // Get time now in EST format
    EST: function() {
        let timestamp1 = (new Date).toString().split(" ");
        timestamp1[4] = military_to_standard(timestamp1[4]);
        return timestamp1[4]; //timestamp1.filter((s, i) => i < 6).toString().replace(/,/g, ' ');
    },

    // Generate string "1s", "2h", etc between now and "time" argument
    elapsed: function( time ) {
        const $SECONDS = Math.abs(timestamp() - time);
        const $iv_table = ["s","min","h","d","mo","y","s","min","h","d","mo","y"];
        const $iv = [$SECONDS,
            ($SECONDS-($SECONDS%60))/60,
            ($SECONDS-($SECONDS%3600))/3600,
            ($SECONDS-($SECONDS%(3600*24)))/(3600*24),
            ($SECONDS-($SECONDS%(3600*24*30)))/(3600*24*30),
            ($SECONDS-($SECONDS%(3600*24*30*12)))/(3600*24*30*12)];
        for (let $i = 5; $i >= 0; $i--) {
            $r = $iv[$i];
            if ($r > 0) {
                if (($r > 1 || $r == 0))
                    $i += 6;
                return $r + "" + $iv_table[$i];
            }
        }
    }
};