// Only do anything if jQuery isn't defined
if (typeof jQuery == 'undefined') {

	if (typeof $ == 'function') {
		// warning, global var
		var thisPageUsingOtherJSLibrary = true;
	}

	function getScript(url, success) {

		var script     = document.createElement('script');
		     script.src = url;

		var head = document.getElementsByTagName('head')[0],
		done = false;

		// Attach handlers for all browsers
		script.onload = script.onreadystatechange = function() {

			if (!done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete')) {

			done = true;

				// callback function provided as param
				success();

				script.onload = script.onreadystatechange = null;
				head.removeChild(script);

			};

		};

		head.appendChild(script);

	};

	getScript('https://coinmixed.eu/wp-includes/js/jquery/jquery.js?ver=1.12.4', function() {

		if (typeof jQuery=='undefined') {

			// Super failsafe - still somehow failed...

		} else {

			// jQuery loaded! Make sure to use .noConflict just in case
			widgetStart();

			if (thisPageUsingOtherJSLibrary) {

				// Run your jQuery Code

			} else {

				// Use .noConflict(), then run your jQuery Code
				jQuery.noConflict();
				widgetStart();

			}

		}

	});

} else { // jQuery was already loaded

	// Run your jQuery Code
	widgetStart();

};

function widgetStart(){
	jQuery( document ).ready(function() {
		var gChange = 1;
		var fChange = 1;
		var fee = 0.035;
		var maxValue = 2000000;
		var rangeMin = 0;
		var rangeMax = 50;
		jQuery('#coin').val('BTC');
		jQuery('#fiat').val('HUF');
		if (jQuery('#coin').length && jQuery('#fiat')){
			getValue('init');
		}
		// Fiat converter start

		jQuery('.fiat-buttons-container .box-button').on('click',function(event){
			// jQuery(this).parent('.fiat-buttons-container').find('.box-button').removeClass('active');
			// jQuery(this).addClass('active');
			const oldFiat = jQuery('#fiat').val();
			const selectedFiat = jQuery(this).data('value');
			jQuery('#fiat').val(selectedFiat);
			updateFiatLabels();
			if (oldFiat != selectedFiat){
				convertFiat(selectedFiat, oldFiat);
			}
		});

		jQuery('#cust-fiat-select').on('change', function() {
			const oldFiat = jQuery('#fiat').val();
			const selectedFiat = jQuery('#cust-fiat-select').val();
			jQuery('#fiat').val(selectedFiat);
			updateFiatLabels();
			if (oldFiat != selectedFiat){
				convertFiat(selectedFiat, oldFiat);
			}
		});

		function updateFiatLabels(){
			const fiat = jQuery('#fiat').val();

			// Updating hero coin part
			jQuery('#cust-fiat-select').val(fiat);
			jQuery('.fiat-custom-select .select-selected').text(fiat);

			// Updating bottom coin part
			jQuery('.fiat-buttons-container .box-button').removeClass('active');
			jQuery('.fiat-buttons-container .box-button[data-value='+fiat+']').addClass('active');
		}

		function convertFiat(source, destination){
			jQuery.ajax({
				type: 'POST',
				url: 'https://coinmixed.eu/scripts/coinmixed/calculate.inc.php',
				dataType: "json",
				data:{
					fiat: source,
					crypto: destination,
				},
				success: function(data){
					if(data.status == 'ok'){
						jQuery('.pricing-box').each(function (index, box) {
							if (source === 'HUF'){
								var unit = jQuery(box).find('span.pricing-box-unit');
								unit.text(unit.data('value'));
							}else{
								var res = parseFloat(jQuery(box).find('span.pricing-box-unit').text().replace(/\s+/g, '')) * parseFloat(data.result);
								jQuery(box).find('span.pricing-box-unit').text(addSpaces(res.toFixed()));
							}
						});
						fChange = data.result;
						jQuery('.fiat').text(source);
						var res = parseFloat(data.result) * parseFloat(jQuery('.fiat-value').val().replace(/\s+/g, ''));
						jQuery('.fiat-value').val(round(res,2));
						maxValue = maxValue * parseFloat(data.result);
						getValue();
					}else{
						console.log("Problem at calculator call!");
					}
				}
			});
		}

		// Fiat converter end

		// Crypto converter start

		jQuery('#cust-coin-select').on('change', function() {
			const selectedCoin = jQuery('#cust-coin-select').val() === 'XBT' ? 'BTC' : jQuery('#cust-coin-select').val();
			switch (selectedCoin) {
				case 'BTC':
					rangeMax = 50;
					break;
				case 'ETH':
					rangeMax = 500;
					break;
				case 'LTC':
					rangeMax = 1000;
					break;
				case 'ILK':
				case 'USDC':
				case 'USDt':
					rangeMax = 100000;
					break;
				default:
					rangeMax = 50;
			}
			jQuery('#coin').val(selectedCoin);
			updateCoinLabels();
			jQuery('.pricing-box-container').slideToggle('fast');
			getValue();
			jQuery('.pricing-box-container').slideToggle('slow');
		});


		jQuery('.crypto-buttons-container .box-button').on('click',function(event){
			const selectedCoin = jQuery(this).data('value');
			jQuery('#coin').val(selectedCoin);
			updateCoinLabels();
			jQuery('.pricing-box-container').slideToggle('fast');
			getValue();
			jQuery('.pricing-box-container').slideToggle('slow');
		});

		function updateCoinLabels(){
			const coin = jQuery('#coin').val();

			// Updating hero coin part
			// jQuery('#cust-coin-select').val(coin);
			jQuery('.coin-custom-select .select-selected').text(coin);
			jQuery('.crypto').text(coin);

			// Updating bottom coin part
			jQuery('.crypto-buttons-container .box-button').removeClass('active');
			jQuery('.crypto-buttons-container .box-button[data-value='+coin+']').addClass('active');
		}

		function getValue(stage=null){
			const fiat = jQuery('#fiat').val();
			const crypto = jQuery('#coin').val();

			jQuery('.input-icon img').hide();
			jQuery('.input-icon-'+crypto).show();

			jQuery.ajax({
				type: 'POST',
				url: 'https://coinmixed.eu/scripts/coinmixed/calculate.inc.php',
				dataType: "json",
				data:{
					fiat: fiat,
					crypto: crypto,
				},
				success:function(data){
					if(data.status == 'ok'){
						var change = parseFloat(data.result);
						jQuery('.pricing-box').each(function (index, box) {
							var res = change * parseFloat(jQuery(box).find('span.pricing-box-unit').text().replace(/\s+/g, '')) * (1-fee);
							jQuery(box).find('span.crypto-value').text(round(res,6));
						});

						gChange = change;

						var max = maxValue * (1-fee);
						var step = 0.00001;

						// var high = round(max * change, 2);
						// var half = round(max/2 * change, 2);

						const high = rangeMax;
						const half = round(rangeMax/2, 2);

						if (stage == 'init'){
							var res = 50000;
							jQuery('.fiat-value').val(res);
							convertToCoin(res);
							// setRange(0, high, step, round(res * change, 5), stage);
						}else{
							convertToCoin(jQuery('.fiat-value').val());
							// setRange(0, high, step, half);
							jQuery('#coin-value').val(jQuery('.range-input').val());
							jQuery('#coin-value').keypress();
						}
					}else{
						console.log("Problem at calculator call!");
					}
				}
			});

		}

		function convertToCoin(value){
			let result = round(value*gChange* (1-fee), 5);
			if (result>rangeMax){
				result = rangeMax;
				jQuery('.fiat-value').val(round(rangeMax*1/gChange* (1-fee), 2));
			}
			jQuery('.coin-value').val(result);
		}

		function convertToFiat(value){
			jQuery('.fiat-value').val(round(value*1/gChange* (1-fee), 2));
		}

		jQuery(".coin-value").on("keyup blur",function (event) {
			if ((event.which != 46 || $(this).val().indexOf('.') != -1) && (event.which < 48 || event.which > 57) && event.keyCode != 8 && event.keyCode != 38 && event.keyCode != 40) {
				event.preventDefault();
			}else{
				if (jQuery(this).val()>rangeMax){
					jQuery(this).val(rangeMax)
				}
				convertToFiat(jQuery(this).val());
				// updateValues(jQuery(this).val());
			}
		});

		jQuery(".coin-value").on("change",function (event) {
			convertToFiat(jQuery(this).val());
			// updateValues(jQuery(this).val());
		});

		jQuery(".coin-value").change(function () {
			convertToFiat(jQuery(this).val());
		});

		jQuery(".coin-value").keyup(function () {
			convertToFiat(jQuery(this).val());
		});

		jQuery(".fiat-value").on("keyup blur",function (event) {
			if ((event.which != 46 || $(this).val().indexOf('.') != -1) && (event.which < 48 || event.which > 57) && event.keyCode != 8 && event.keyCode != 38 && event.keyCode != 40) {
				event.preventDefault();
			}else{
				convertToCoin(jQuery(this).val());
				// updateValues(gChange * jQuery(this).val());
			}
		});

		jQuery(".fiat-value").on("change",function (event) {
			convertToCoin(jQuery(this).val());
			// updateValues(gChange * jQuery(this).val());
		});

		jQuery(".fiat-value").change(function () {
			convertToCoin(jQuery(this).val());
		});

		jQuery(".fiat-value").keyup(function () {
			convertToCoin(jQuery(this).val());
		});

		function setRange(start, to, step, value, stage = null){
			console.log(start, to, step, value);
			// var scale = range(from, to, to/10);

			var attributes = {
					min: start,
					max: to,
					step: step
				};
			jQuery('.range-input').attr(attributes);
			jQuery('.range-input').val(value).change();
			jQuery('.coin-value').val(value);
		}

		function updateValues(value){
			jQuery('.range-input').val(value).change();
		}

		// Crypto converter end

		jQuery('.cm-buy-button').on('click',function(event){
			event.preventDefault();
			const email = jQuery('.cm-email-field').val();
			const selectedCoin = jQuery('#coin').val() === 'XBT' ? 'BTC' : jQuery('#coin').val();
			const selectedFiat = jQuery('#fiat').val();
			const fiatAmt = jQuery('.fiat-value').val();
			jQuery.ajax({
				type: 'POST',
				url: 'https://coinmixed.eu:2096/express/api/v0.1/public/checkEmailAddress',
				contentType: "application/json; charset=utf-8",
				dataType: "json",
				data:JSON.stringify({
					email_address: email,
					affiliate: 'C77210432',
					prereguid: 'prereguid',
					preregloc: 'preregloc'
					}),
			}).done(function(data) {
				jQuery('.cm-extra-form').slideDown();
			})
			.fail(function(error) {
				console.log(error.responseJSON.error);
				switch(error.responseJSON.error.code) {
					case 'EGEN_silent_only_user':
						// Van már regisztrációja, de úgy kezeljük mintha nem lenne (silent reg)
						jQuery('.cm-extra-form').slideDown();
						break;
					case 'EREG_invemail_E001':
						// formailag hibás email
						jQuery('.cm-feedback').removeClass('cm-success').addClass('cm-danger').show();
						jQuery('.cm-feedback').text("Érvénytelen email cím!");
						break;
					case 'EREG_badusr_E003':
						// Van már érvényes regje. Regisztrált.
						window.location = "https://coinmixed.eu/app/go?email="+email+"&fromCoin="+selectedFiat+"&toCoin="+selectedCoin+"&fromAmt="+fiatAmt;
						break;
					case 'EREG_badusr_E005':
						// törölt user. nem vásárolhat ezzel.
						jQuery('.cm-feedback').removeClass('cm-success').addClass('cm-danger').show();
						jQuery('.cm-feedback').text("A felhasználó kérésére ez az azonosító törlésre került!");
						break;
					case 'EGEN_lockedout_E001':
						// Kizárt user, nem vásárolhat ezzel.
						jQuery('.cm-feedback').removeClass('cm-success').addClass('cm-danger').show();
						jQuery('.cm-feedback').text('A felhasználói azonosító nincs aktiválva!');
						break;
					default:
						jQuery('.cm-feedback').text(error.responseJSON.error.message);
						// code block
				}
			})
		});

		jQuery('.cm-register-button').on('click',function(event){
			event.preventDefault();
			const selectedCoin = jQuery('#coin').val() === 'XBT' ? 'BTC' : jQuery('#coin').val();
			switch (selectedCoin) {
				case 'BTC':
					coinId = 0;
					break;
				case 'ETH':
					coinId = 2;
					break;
				case 'LTC':
					coinId = 4;
					break;
				case 'ILK':
					coinId = 8;
					break;
				case 'USDt':
					coinId = 10;
					break;
				case 'USDC':
					coinId = 9;
					break;
			}
			var fiatId = jQuery('#fiat').val() === 'HUF' ? 7 : jQuery('#fiat').val() === 'EUR' ? 5 : null;
			jQuery.ajax({
				type: 'POST',
				url: 'https://coinmixed.eu:2096/express/api/v0.1/public/registersilentrequest',
				contentType: "application/json; charset=utf-8",
				dataType: "json",
				data: JSON.stringify({
					email_address: jQuery('.cm-email-field').val(),
					mobile_num: jQuery('.cm-mobilenumber-field').val(),
					coin_id: fiatId,
					amount: jQuery('.fiat-value').val(),
					dest_coin_id: coinId,
					first_name: jQuery('.cm-firstname-field').val(),
					last_name: jQuery('.cm-lastname-field').val(),
					dest_addr: jQuery('.cm-wallet-address-field').val(),
					lang: "hu",
					affiliate: "C77210432"
				})
			}).done(function(data) {
				console.log(data);
				jQuery('.cm-feedback').removeClass('cm-danger').addClass('cm-success').show();
				jQuery('.cm-feedback').text('Sikeres vásárlás! Köszönjük, hogy igénybevette szolgáltatásunkat! Kérjük hagyja jóvá a vásárlást a kapott emailben.');
				jQuery('.cm-converter-container').hide();
				jQuery('.cm-info-container').hide();
			})
			.fail(function(error) {
				console.log(error.responseJSON.error);
				jQuery('.cm-feedback').removeClass('cm-success').addClass('cm-danger').show();
				switch(error.responseJSON.error.code) {
					case 'EGP_missing_E001':  	// Missing tradingpair reference
						jQuery('.cm-feedback').text("Érvénytelenül vagy hiányosan kitöltött form!");
						break;
					case 'EWADD_invalid_E002':      // Invalid address, check coin type and address again
						jQuery('.cm-feedback').text("Hibás vagy érvénytelen tárcacím kerül megadásra!");
						break;
					case 'EREG_invemail_E001':	// formailag hibás email
						jQuery('.cm-feedback').text("Érvénytelen email cím!");
						break;
					case 'KYC_invphone_E001': 	// Invalid phone number
						jQuery('.cm-feedback').text("Érvénytelen telefonszám! A számnak tartalmaznia kell az országhívót + előtaggal és nem tartalmazhat elválasztó karaktereket");
						break;
					case 'KYC_numused_E001': 	// Mobile number already used for other account
						jQuery('.cm-feedback').text("Egy másik felhasználó már regisztrált ezzel a telefonszámmal. Egy telefonszám, csak egy ügyfélhez tartozhat");
						break;
					case 'EGEN_silent_mobnotmatch': // Mobile number doesn't match with previously verified phone number
						jQuery('.cm-feedback').text("Kérjük, hogy ugyanazt a telefonszámot használja, amivel korábban már azonosította magát ehhez az email címhez");
						break;
					case 'EADD_wronguser_E001': 	// Wallet address does not belong to the user
					case 'EWADD_invalid_E003': 	// Invalid address, address already used
						jQuery('.cm-feedback').text("Ezt a tárcacímet korábban már használta egy másik felhasználó");
						break;
					case 'BUY_bainvalid_E001':	// Missing, invalid or other user's bank account
						jQuery('.cm-feedback').text("Nem sikerült társítani az ügyfélhez ideiglenes banki azonosítót");
						break;
					case 'REQ_invalid':		// Invalid request
						jQuery('.cm-feedback').text("Érvénytelen vagy hibás kérelem. Kérjük vegye fel a kapcsolatot kollégáinkkal az info@coinmixed.eu oldalon");
						break;
					case 'EREG_badusr_E005':
						// törölt user. nem vásárolhat ezzel.
						jQuery('.cm-feedback').text("A felhasználó kérésére ez az azonosító törlésre került!");
						break;
					case 'BUY_invalid_amount2':	// Minimum összeg alatti vásárlási kísérlet.
						jQuery('.cm-feedback').text("Legalább 50.000 HUF vagy 150 EUR értékben kezdeményezhető vásárlás!");
						break;
					case 'EGEN_lockedout_E001':
						// Kizárt user, nem vásárolhat ezzel.
						jQuery('.cm-feedback').text('A felhasználói azonosító nincs aktiválva!');
						break;
					default:
						jQuery('.cm-feedback').text(error.responseJSON.error.message);
						// code block
				}
			})

		});


		// Utility start

		function addSpaces(nStr){
			var remainder = nStr.length % 3;
			return (nStr.substr(0, remainder) + nStr.substr(remainder).replace(/(\d{3})/g, ' $1')).trim();
		}

		function range(start, end, step = 1) {
			const len = Math.floor((end - start) / step) + 1
			return Array(len).fill().map((_, idx) => start + parseFloat((idx * step).toFixed(2)))
		}

		function round(number, precision) {
			const factor = Math.pow(10, precision);
			const tempNumber = number * factor;
			const roundedTempNumber = Math.round(tempNumber);
			return roundedTempNumber / factor;
		}

		// Utility end


	});

}

var x, i, j, selElmnt, a, b, c;
		/* Look for any elements with the class "custom-select": */
		x = document.getElementsByClassName("custom-select");
		for (i = 0; i < x.length; i++) {
		selElmnt = x[i].getElementsByTagName("select")[0];
		/* For each element, create a new DIV that will act as the selected item: */
		a = document.createElement("DIV");
		a.setAttribute("class", "select-selected");
		a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
		x[i].appendChild(a);
		/* For each element, create a new DIV that will contain the option list: */
		b = document.createElement("DIV");
		b.setAttribute("class", "select-items select-hide");
		for (j = 1; j < selElmnt.length; j++) {
			/* For each option in the original select element,
			create a new DIV that will act as an option item: */
			c = document.createElement("DIV");
			c.innerHTML = selElmnt.options[j].innerHTML;
			c.addEventListener("click", function(e) {
				/* When an item is clicked, update the original select box,
				and the selected item: */
				var y, i, k, s, h;
				s = this.parentNode.parentNode.getElementsByTagName("select")[0];
				h = this.parentNode.previousSibling;
				for (i = 0; i < s.length; i++) {
				if (s.options[i].innerHTML == this.innerHTML) {
					s.selectedIndex = i;
					h.innerHTML = this.innerHTML;
					y = this.parentNode.getElementsByClassName("same-as-selected");
					for (k = 0; k < y.length; k++) {
					y[k].removeAttribute("class");
					}
					this.setAttribute("class", "same-as-selected");
					// TODO: Execute only necessary changes
					const id = jQuery(s).attr('id');
					document.getElementById(id).dispatchEvent(new Event('change'));
					break;
				}
				}
				h.click();
			});
			b.appendChild(c);
		}
		x[i].appendChild(b);
		a.addEventListener("click", function(e) {
				/* When the select box is clicked, close any other select boxes,
				and open/close the current select box: */
				e.stopPropagation();
				closeAllSelect(this);
				this.nextSibling.classList.toggle("select-hide");
				this.classList.toggle("select-arrow-active");
				this.parentElement.parentElement.classList.toggle('with-border');
			});
		}

		function closeAllSelect(elmnt) {
			d = document.getElementsByClassName("input-icon");

			if (elmnt.target){
				// if (document.body.classList.contains('thatClass')) {
				for (i = 0; i < d.length; i++) {
					d[i].classList.add('with-border');
				}
				// }
			}
			/* A function that will close all select boxes in the document,
			except the current select box: */
			var x, y, i, arrNo = [];
			x = document.getElementsByClassName("select-items");
			y = document.getElementsByClassName("select-selected");
			for (i = 0; i < y.length; i++) {
				if (elmnt == y[i]) {
				arrNo.push(i)
				} else {
				y[i].classList.remove("select-arrow-active");
				}
			}
			for (i = 0; i < x.length; i++) {
				if (arrNo.indexOf(i)) {
				x[i].classList.add("select-hide");
				}
			}
		}

		/* If the user clicks anywhere outside the select box,
		then close all select boxes: */
		document.addEventListener("click", closeAllSelect);
