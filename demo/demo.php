<!DOCTYPE html>
<html>
<head>
<title>GCAL JS Connection</title>

<?php
// Calendar ID of the calendar to display. This can be obtained by signing in to
// Google Calendar, opening the Calendar Settings of the wanted calendar
// and across from where it says Calendar Address there will be reference to a
// Calendar ID. Copy the Calendar ID and paste below. Note that the Calendar
// must be public to work.
$calendar_id = 'lg9uq74mnu22c78r30c144k3qs@group.calendar.google.com';
$start_min =  date('Y-m-d\TH:i:s\Z', mktime(0, 0, 0));
$start_max = date('Y-m-d\TH:i:s\Z', mktime(0, 0, 0) + 86400 * 21);
//$start_min =  date('Y-m-d', mktime(0, 0, 0));
//$start_max = date('Y-m-d', mktime(0, 0, 0) + 86400 * 14);
$uri = '//www.google.com/calendar/feeds/'.$calendar_id.'/public/full'.
'?alt=json-in-script'.
'&amp;callback=gdata_json_handler'.
'&amp;start-min='.$start_min.
'&amp;start-max='.$start_max.
'&amp;orderby=starttime'.
'&amp;sortorder=ascending'.
'&amp;singleevents=true'.
//'&futureevents=true'. // This disables the start-min and start-max
'';
?>


<style>

a {text-decoration:none;border-bottom:1px solid #ddd;}
a:hover {border-color:#999;}

</style>

</head>

<body>

<h1>GCAL JS Connection</h1>
<div class="events">
<div class="events-content"></div>
</div>

<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
<script type="text/javascript" src="gcal-js-connection.js"></script> 
<script type="text/javascript" src="<?php echo $uri; ?>"></script>

</body>
</html>
