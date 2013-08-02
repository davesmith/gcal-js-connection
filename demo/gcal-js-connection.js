
// Event Calendar for the GHP
// Dave Smith, Web Design Office, 2012 April.
var datePlate = {
	mondayWeeks: true,
	days: {
		en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
	},
	daysShort: {
		en: ['Sun', 'Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat']
	},
	months: {
		en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
	},
	monthsShort: {
		en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	},
	i18n: {
		'tomorrow': {en: 'Tomorrow'},
		'today': {en: 'Today'},
		'laterThisWeek': {en: 'Later this week'},
		'nextWeek': {en: 'Next week'}
	},
	relFuture: [
		{
			// Default
			t: function(t, r) {return 0},
			p: function(timestamp, lang){return datePlate.months.en[timestamp.getMonth()] + ' ' + timestamp.getDate() + ', ' + datePlate.days.en[timestamp.getDay()];}
		}
		,{
			// Today: Less than 1 day away
			t: function(t, r) {return 86400000},
			p: function(timestamp, lang){return datePlate.i18n.today[lang];}
		}
		,{
			// Tomorrow: Less 2 days away
			t: function(t, r) {return 172800000},
			p: function(timestamp, lang){return datePlate.i18n.tomorrow[lang];}
		}
		,{
			// Later this week
			t: function(t, r) {var bob = 86400000 * (7 + ((datePlate.mondayWeeks) ? 1 : 0) - r.getDay());return (bob > 0) ? bob : 0},
			p: function(timestamp, lang){return datePlate.i18n.laterThisWeek[lang];}
		}
		,{
			// Next week
			t: function(t, r) {var bob = 86400000 * (14 + ((datePlate.mondayWeeks) ? 1 : 0) - r.getDay());return (bob > 0) ? bob : 0},
			//p: function(timestamp, lang){return datePlate.months.en[timestamp.getMonth()] + ' ' + timestamp.getDate();}
			p: function(timestamp, lang){return datePlate.i18n.nextWeek[lang];}
		}
		,{
			// Reset to default
			t: function(t, r) {var bob = 86400000 * (21 + ((datePlate.mondayWeeks) ? 1 : 0) - r.getDay());return (bob > 0) ? bob : 0},
			p: function(timestamp, lang){return datePlate.months.en[timestamp.getMonth()] + ' ' + timestamp.getDate();}
		}
		//{
		//	t: 691200000, // Less than 8 days away
		//	//p: {en: function(timestamp){return 'Next ' + datePlate.days.en[timestamp.getDay()] + ' ' + timestamp.getDate() + ' ' + datePlate.months.en[timestamp.getMonth()];}}
		//	p: {en: function(timestamp){return 'Next ' + datePlate.days.en[timestamp.getDay()];}}
		//}
	],
	getRelativeDate: function(timestamp, lang, relTimestamp) {
		var timeDiff = '', i = 0, str = '';
		relTimestamp = relTimestamp || '';
		lang = lang || 'en';
		if (relTimestamp) {
			timeDiff = timestamp.valueOf() - relTimestamp.valueOf();
			//console.log(timeDiff);
			dpRelFuture = datePlate.relFuture;
			dpRelFutureLength = dpRelFuture.length;
			for (i; i < dpRelFutureLength; i++) {
				if (timeDiff < dpRelFuture[i].t(timestamp, relTimestamp)) {
					str += dpRelFuture[i].p(timestamp, lang);
					break;
				}
			}
		}
		str = str || datePlate.relFuture[0].p(timestamp, lang);
		return str;
	},
	getUTCdate: function(y, m, d, t) {
		// Thanks to https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date
		function pad(n) {
			return n < 10 ? '0' + n : n;
		}
		var utc = y + m + d;
		if (t !== '') {
			utc += 'T'+ t.replace(/:/g, '').replace(/\.000Z/, 'Z');
		}
		return utc;
	},
	getMultidayEventDate: function(start, end, lang) {
		var str = start.getDate();
		if (start.getMonth() !== end.getMonth()) {
			str += ' ' + datePlate.months[lang][start.getMonth()] + ' &ndash; ';
		}
		else {
			str += '&ndash;';
		}
		str += end.getDate() + ' ' + datePlate.months[lang][end.getMonth()];
		return str;
	}
};

// View Options
var viewOptions = {
	allDayEventTimeText: '' // If there is no time information associated with an event then it is considered an All Day Event. Instead of the time, this text will show.
,	timeTrimLeadingZeros: true // False by default
,	time24hr: false // True by default
,	googleCalAddEventWebsite: 'www.dave-smith.info' // True by default
,	googleCalAddEventWebsiteName: 'Dave Smith.info' // True by default
};

// The following assumes the Google Calendar Query Parameters are set as follows:
// singleevents=true, sortorder=ascending, orderby=starttime and futureevents=false(default)
function gdata_json_handler(root) {
	/**/
	var lang = 'en',
		feed = root.feed,
		gdEntries = feed.entry || [],
		entries = [], // Where all the 
		entriesByDRYDate = [],
		lowerBound = '<?php echo $start_min; ?>',
		upperBound = '<?php echo $start_max; ?>',
	
		lowerBoundSplit = lowerBound.split('T')[0].split('-'),
		upperBoundSplit = upperBound.split('T')[0].split('-'),
	
		lowerBoundDate = new Date(lowerBoundSplit[0], lowerBoundSplit[1] - 1, lowerBoundSplit[2]),
		upperBound_date = new Date(upperBoundSplit[0], upperBoundSplit[1] - 1, upperBoundSplit[2]),

		currentDate = new Date(),
		todayDate = currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
		firstRun = true;
	
	//var week_date = new Date(lowerBoundSplit[0], lowerBoundSplit[1] - 1, lowerBoundSplit[2] - currentDate.getDay() + ((datePlate.monday_week)? 1 : 0)); // 0-6 0=sun
	if (gdEntries.length) {
		
		// Model
		var html = '', addToCal = '', currentRelativeDate = '', relativeDate;
		var firstTime = true, entry, startSplit, startDateSplit, dateChanged, gdEntry, title, start, end, contentHTML, links, time, newDay, description, classValue, titleHTML;
		for (var i = 0, gdEntriesLength = gdEntries.length; i < gdEntriesLength; ++i) {
			gdEntry = gdEntries[i];
			if (gdEntry['gCal$privateCopy']) {
				continue;
			}
			entry = {};
			
			entry.title = gdEntry.title.$t.replace(/</g, '&lt;').replace(/>/g, '&gt;');
			entry.gd = gdEntry;
			entry.start = (gdEntry['gd$when']) ? gdEntry['gd$when'][0].startTime : '';
			entry.end = (gdEntry['gd$when']) ? gdEntry['gd$when'][0].endTime : '';
			entry.dateChanged = false;
			entry.multidate = false;
			entry.multidates = '';
			entry.meta = {};
			entry.metaContent = gdEntry.content.$t.split('---');
			entry.metaInfoURL = '';
			entry.metaThumbnailURL = '';
			entry.googleCalAddEventURI = '';
			
			content = entry.metaContent.shift();
			entry.metaContent = entry.metaContent[0] || '';
			content = content.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br />') || '';
			contentHTML = '';
			links = '';
			time = '';
			newDay = '';
			classValue = '';
			titleHTML = '';
			
			if (entry.start !== '' && entry.end !== '') {
				
				// Process the Google Calendar start and end datetimes to be something more pliable
				startSplit = entry.start.split('T');
				endSplit = entry.end.split('T');

				startDateSplit = startSplit[0].split('-');
				endDateSplit = endSplit[0].split('-');

				entry.startDate = new Date(startDateSplit[0], startDateSplit[1] - 1, startDateSplit[2]);
				entry.endDate = new Date(endDateSplit[0], endDateSplit[1] - 1, endDateSplit[2]);

				startTime = startSplit[1] || '';
				if (startTime !== '') {
					startTime = startTime.split(':');
					time = startTime[0] + ':' + startTime[1];
				}
				endTime = endSplit[1] || '';
				if (endTime !== '') {
					endTime = endTime.split(':');
					time += '&ndash;' + endTime[0] + ':' + endTime[1];
				}
				entry.time = time || viewOptions.allDayEventTimeText;
				
				entry.startDateTime = new Date(startDateSplit[0], startDateSplit[1] - 1, startDateSplit[2], startTime[0] || 0, startTime[1] || 0);
				entry.endDateTime = new Date(endDateSplit[0], endDateSplit[1] - 1, endDateSplit[2], endTime[0] || 0, endTime[1] || 0);

				 // Start and end dates for the add this event to your Google calendar link. DS tried to make this a startDateTimeUTC but for some reason it didn't work. Worth another try at some point.
				entry.startDateUTC = datePlate.getUTCdate(startDateSplit[0], startDateSplit[1], startDateSplit[2], startSplit[1] || '');
				entry.endDateUTC = datePlate.getUTCdate(endDateSplit[0], endDateSplit[1], endDateSplit[2], endSplit[1] || '');

				//console.log(entry.startDateTime.getHours());
				//console.log(entry.endDateTime.getHours());
				//console.log(startSplit[1] || '');
				//console.log(entry.startDateUTC+'/'+entry.endDateUTC);
				
				
				// Check for a multi-day event. A multiday event lasts longer than a day
				if ((entry.endDate - entry.startDate) > 86400000) {
					entry.multidate = true;
				}
				
				
				// Process the content/description, this will convert HTML links in the description into real HTML links
				entry.content = content;
				/*
				links = content.split('&lt;a ');
				links_length = links.length;
				for (var j = 1; j < links.length; j++) {
					var link_j_split_1 = links[j].split('&gt;');
					if (link_j_split_1.length > 1) {
						link_j_split_1 = [link_j_split_1.shift(), link_j_split_1.join('&gt;')];
						var link_j_split_2 = link_j_split_1[1].split('&lt;/a&gt;');
						links[j] = '<a ' + link_j_split_1[0] + '>' + link_j_split_2[0] + '</a>' + (link_j_split_2[1] || '');
					}
				}
				entry.content = links.join('').replace(/^\s+/g, '').replace(/\s+$/g, '');	
				*/
				
				// Process the content meta.
				// Get the event info URI.
				if (entry.metaContent) {
					entry.metaInfoURL = entry.metaContent.match(/\bInfo:\s*(.*)\b/i);
					if (entry.metaInfoURL) {
						entry.metaInfoURL = entry.metaInfoURL[1];
					}
					entry.metaThumbnailURL = entry.metaContent.match(/\bThumbnail:\s*(.*)\b/i);
					if (entry.metaThumbnailURL) {
						entry.metaThumbnailURL = entry.metaThumbnailURL[1];
					}
				}
				entry.googleCalAddEventURI = 'http://www.google.com/calendar/event?action=TEMPLATE&text='+entry.title+'&details='+encodeURI(gdEntry.content.$t)+'&dates='+entry.startDateUTC + '/' + entry.endDateUTC + '&sprop='+encodeURI(viewOptions.googleCalAddEventWebsiteURL) + '&sprop=name:'+encodeURI(viewOptions.googleCalAddEventWebsiteName);
				
				// For a titles focused view.
				entries.push(entry);
				
				
				
				relativeDate = datePlate.getRelativeDate(((entry.startDate >= lowerBoundDate) ? entry.startDate : lowerBoundDate), lang, todayDate);
				// For a DRY dates focused view.
				if (relativeDate !== currentRelativeDate) {
					entriesByDRYDate.push({date:relativeDate, entries:[entry]});
					currentRelativeDate = relativeDate;
				}
				else {
					entriesByDRYDate[entriesByDRYDate.length - 1].entries.push(entry);
				}
				firstTime = false;
			}
		}
		/** /
		// View: For DRY Dates
		entriesByDRYDateLength = entriesByDRYDate.length
		if (entriesByDRYDateLength) {
			for (var i = 0; i < entriesByDRYDateLength; i++) {
				
				var entryByDRYDate = entriesByDRYDate[i],
					entries = entryByDRYDate.entries;
				dryClassValue = '';
				
				if (i === 0) {
					dryClassValue += 'event-firstdaygroup ';
				}
				
				//html += '<div class="event-daygroup ' + dryClassValue + '"><strong class="event-daygroupdate">'+entryByDRYDate.date.getDate() + ' ' + datePlate.months[lang][entryByDRYDate.date.getMonth()]+'</strong><ul>';
				html += '<div class="event-daygroup ' + dryClassValue + '"><strong class="event-daygroupdate">'+entryByDRYDate.date+'</strong><ul>';
				for (var j = 0, entriesLength = entries.length; j < entriesLength; j++) {
					
					var entry = entries[j];
					addToCal = classValue = '';
					
					if (j === 0) {
						classValue += 'event-first ';
					}
					if (entry.multidate) {
						classValue += 'event-ismultiday ';
					}
					if (entry.content !== '') {
						classValue += 'event-hascontent ';
					}
					titleHTML = entry.title;
					if (entry.metaInfoURL) {
						titleHTML = '<a href="' + entry.metaInfoURL + '">';
					}
					if (entry.metaThumbnailURL) {
						titleHTML += '<img class="event-thumbnail" src="' + entry.metaThumbnailURL + '" alt="" />';
						classValue += 'event-hasthumbnail ';
					}
					if (entry.metaInfoURL) {
						titleHTML += entry.title + '</a>';
					}
					// Add to Google Calendar link
					//addToCal = '<a class="event-add" title="Add to my Google Calendar" href="http://www.google.com/calendar/event?action=TEMPLATE&text='+entry.title+'&details='+encodeURI(gdEntry.content.$t)+'&dates='+entry.startDateUTC + '/' + entry.endDateUTC + '&sprop=http%3A%2F%2Fwww.dave-smith.info%2F&sprop=name:Dave%20Smith%info">Add</a>';
					html += '<li class="event ' + classValue + '">'+
								'<div class="event-header">'+
									'<strong class="event-title">' + titleHTML + '</strong>'+
								'</div>'+
								'<div class="event-content">' + entry.content +'</div>'+
								'<div class="event-footer">'+
									'<div class="event-date">' + ((entry.multidate) ? datePlate.getMultidayEventDate(entry.startDate, entry.endDate, lang) : entry.startDate.getDate() + ' ' + datePlate.months[lang][entry.startDate.getMonth()]) + '</div>'+
									'<div class="event-time">' + entry.time + '</div>'+
									//((entry.multidate) ? '<div class="event-date">' + datePlate.getMultidayEventDate(entry.startDate, entry.endDate, lang) + '</div>' : '')+
									//'<div class="event-add">'+addToCal+'</div>'+
								'</div>'+
							'</li>';
				}
				html += '</ul></div>';
			}
		}
		/**/
		// View: For Titles
		entriesLength = entries.length;
		if (entriesLength) {
			html += '<h2>Events</h2>';
			html += '<ul>';
			for (i = 0; i < entriesLength; i++) {
				var entry = entries[i];
				addToCal = classValue = '';
				
				if (i === 0) {
					classValue += 'event-first ';
				}
				if (entry.multidate) {
					classValue += 'event-ismultiday ';
				}
				if (entry.content !== '') {
					classValue += 'event-hascontent ';
				}
				
				//titleHTML = '<a href="' + (entry.metaInfoURL || entry.gd.link[0].href) + '">';
				//if (entry.metaThumbnailURL) {
				//	titleHTML += '<img class="event-thumbnail" src="' + entry.metaThumbnailURL + '" alt="" />';
				//	classValue += 'event-hasthumbnail ';
				//}
				//titleHTML += entry.title + '</a>';
				
				titleHTML = '';
				if (entry.gd.link[0].href) {
					titleHTML += '<a href="' + entry.gd.link[0].href + '">';
				}
				if (entry.metaThumbnailURL) {
					titleHTML += '<img class="event-thumbnail" src="' + entry.metaThumbnailURL + '" alt="" />';
					classValue += 'event-hasthumbnail ';
				}
				titleHTML += entry.title;
				if (entry.gd.link[0].href) {
					titleHTML += '</a>';
				}
				//gcalLink = '<a href="'+entry.gd.link[0].href+'" title="Google Calendar: '+entry.title+'">Calendar</a>';
				
				websiteLink = '';
				if (entry.metaInfoURL) {
					websiteLink = '<a href="'+entry.metaInfoURL+'" title="Website for the event '+entry.title+'">Website</a>';
				}
				
				// Add to Google Calendar link
				//addToCal = '<a class="event-add" title="Add to my Google Calendar" href="http://www.google.com/calendar/event?action=TEMPLATE&text='+entry.title+'&details='+encodeURI(gdEntry.content.$t)+'&dates='+entry.startDateUTC + '/' + entry.endDateUTC + '&sprop=http%3A%2F%2Fwww.dave-smith.info%2F&sprop=name:Dave%20Smith%20info">Add</a>';
				html += '<li class="event ' + classValue + '">'+
							'<div class="event-header">'+
								'<strong class="event-title">' + titleHTML + '</strong>'+
							'</div>'+
							'<div class="event-content">' + window['github.com/davesmiths/linkerjs/1.0'](entry.content) +'</div>'+
							'<div class="event-footer">'+
								'<div class="event-date">' + ((entry.multidate) ? datePlate.getMultidayEventDate(entry.startDate, entry.endDate, lang) : entry.startDate.getDate() + ' ' + datePlate.months[lang][entry.startDate.getMonth()]) + '</div>'+
								'<div class="event-time">' + entry.time + '</div>'+
								'<div class="event-website-link">'+websiteLink+'</div>'+
								//'<div class="event-add">'+addToCal+'</div>'+
							'</div>'+
						'</li>';
			}
			html += '</ul>';
		}
		/**/
		if (html !== '' && html !== '<ul></ul>') {
			$(function() {
				$('html').addClass('j');
				//alert(html);
				var more = 'More',
					less = 'Less',
					description_li = $('div.events-content').html(html).find('li:has(div.description)');
					
				/** /
				description_li.find('.info2').prepend(' <a href="#" title="Show the event description" class="description-toggle">'+more+'</a>');
				
				$('div.events-content').delegate('a.description-toggle', 'click', function() {
					var $this = $(this),
						closest_li = $this.closest('li');
					// YouTube
					closest_li.find('a[href*="youtube.com/watch"]').each(function() {
						var $this = $(this);
						var width = $this.closest('div').width();
						var height = Math.ceil(width/16*9) + 30;
						var video_code = $this.attr('href').replace(/^.*?v=/, '');
						$this.replaceWith('<div class="iframe-wrap" style="width:100%;height:'+height+'px;"><iframe title="' + $this.text() + '" width="' + width + '" height="' + height + '" style="width:100%;" src="http://www.youtube.com/embed/' + video_code + '?fs=1&showinfo=0&rel=0" frameborder="0"></iframe></div>');
					});
					// Image
					closest_li.find('a[href$=".jpg"]').each(function() {
						var $this = $(this);
						var width = $this.closest('div').width();
						var href = $this.attr('href');
						$this.replaceWith('<img src="' + href + '" alt="' + $this.text() + '" />');
					});
					// Description
					// The following may seem elaborate for a show/hide toggle but it is to avoid
					// iframes (YouTube) from slowing the animation.
					var description_open = closest_li.find('div.description').is('.open');
					if (description_open) {
						$this.html(' ' + more);
						closest_li.find('iframe').css({display:'none'});
						closest_li.find('div.description').removeClass('open').animate({height:'toggle'}, {duration: 200});
					}
					else {
						$this.html(' ' + less);
						closest_li.find('div.description').animate({height:'toggle'}, {duration: 200, complete: function() {
							$(this).addClass('open');
							closest_li.find('iframe').css({display:'block'});
						}});
					}
					return false;
				});
				/**/
			});
		}
	}
	/**/
};

window['github.com/davesmiths/linkerjs/1.0'] = function(str) {
	
	str = str || '';
	
	var replacer = function (match, p1, p2) {
		
		return '<a href="'+p2+'">'+p1.replace(/_/g, ' ')+'</a>';
	};
	
	return str.replace(/([^\s]+)\s+\(\s*(https?:\/\/[^\s]+)\s*\)/g, replacer);
	
};