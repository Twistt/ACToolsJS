//ToDo: Add sanity checks for malformed or absent params
//Author: William Harris
//Date: 2016
//
//Usage: 
//      MVC: @Html.TextBoxFor(m => m.PhonePrefix, new { @class = "field text", value = "", size = "3", maxlength = "3", tabindex = "8", required = "true", type = "tel", data_validation = "numeric:3:bottom", data_validation_message = "3 chars <br> (numeric)" })
//      HTML: <select id="Initiator" name="Initiator" class="field select medium" tabindex="11" data-validation="length:2" data-validation-message="You must choose a value.">
//Additional Info:
//      "Right" alignment is default. Supported validation message alignments are "Bottom" or none for right;
//
// -- Supprted Properties --
// numeric:n
// numeric:n:bottom
// maxlength:n:minlength:n
// maxlength:x:minlength:y:bottom
// length:n
// length:n:bottom
// email <== contains @ and . minimum of 8 chars
// fullname <==(expects 2 distinct words with a space seperation 2 characters min [for each word])
// multicheck:nameofcheckboxgroup <==(can be applied to the PARENT element of a group of checkboxes.[this will get all checkboxes by that name contained within])
// custom: funcValidateCustom <==(use for custom validation functions it will call this function with the source element as the parameter and your function should return true or false.)
// checkbox
// button <==(applies a click handler to the element - use to tell where the final validation and then submit action should occur.)
//select:'defaultvalue' <== default value to ignore - such as "--" and "select"
//select:'defaultvalue':bottom
function acValidation(formid) {
    var elementid = 0;
    var me = this;
    this.Failed = new Event();
    this.Success = new Event();
    this.ElementFailed = new Event();
    this.ElementPassed = new Event();
    this.ElementBlur = new Event();
    this.FormId = formid;
    this.AttachValidation = function (container) {
        //alert("starting validation!");
        if (container === undefined) container = $(".acValidate input, .acValidate select");
        //alert(container.length);
        container.each(function () {
            if ($(this).attr("data-validation") !== undefined) {
                $(this).unbind('blur');
            }
        });
        container.each(function () {
            //console.log($(this).attr("name"));
            if ($(this).attr("data-validation") !== undefined) {
                $(this).blur(function () {
                    ValidateInput($(this));
                    me.ElementBlur.raiseEvent($(this));
                });
                if ($(this).attr("data-validation").contains("custom")) {
                    //alert("found a custom field");
                    // $(this).unbind('blur');
                    $(this).change(function () {
                        ValidateInput($(this));
                    });
                }
                if ($(this).attr("data-validation") === "checked") {
                    $(this).change(function () {
                        ValidateInput($(this));
                    });
                }
                if ($(this).attr("data-validation").contains("select")) {
                    $(this).change(function () {
                        ValidateInput($(this));
                    });
                }
                if ($(this).attr("data-validation") === "click") {
                    $(this).click(function () {
                        me.DoValidation(container);
                    });
                }
                if ($(this).attr("data-validation").contains("multicheck")) {
                    var parent = $(this);
                    var rules = $(this).attr("data-validation").split(":");
                    $("[name=" + rules[1] + "]:checkbox").each(function () {
                        $(this).change(function () {
                            ValidateInput(parent);
                        });
                    });
                }
            }
        });
    }
    this.DoValidation = function (container) {
        console.log("starting validation");
        me.ValidationMessages = [];
        //alert("starting validation!");
        if (container === undefined) container = $(".acValidate input, .acValidate select");
        //alert(container.length);
        container.each(function () {
            if ($(this).attr("data-validation") !== undefined) {
                ValidateInput($(this));
                if ($(this).attr("data-validation").contains("custom")) {
                    ValidateInput($(this));
                }
                if ($(this).attr("data-validation") === "checked") {
                    ValidateInput($(this));
                }
                if ($(this).attr("data-validation").contains("select")) {
                    ValidateInput($(this));
                }
                if ($(this).attr("data-validation").contains("multicheck")) {
                    var parent = $(this);
                    var rules = $(this).attr("data-validation").split(":");
                    $("[name=" + rules[1] + "]:checkbox").each(function () {
                        ValidateInput(parent);
                    });
                }
            }
        });
        if (me.ValidationMessages.length > 0) {
            me.Failed.raiseEvent();
            return false;
        }
        else {
            me.Success.raiseEvent();
            return true;

        }

    }
    this.ValidationMessages = [];
    function ValidateInput(ele) {
        //console.log(ele.attr("id"));
        var ValidationFailed = 0;
        if (ele.attr("data-validation") !== undefined) {
            var rule = ele.attr("data-validation");
            var prule = rule.split(",");
            for (var i = 0; i < prule.length; i++) {
                //console.log(prule[i]);
                if (prule[i].contains(":")) {
                    var rules = prule[i].split(":");
                    if (rules[0].toLowerCase() === "length") {
                        if (parseInt(rules[1]) > ele.val().length) {
                            var message = "You need to type at least " + parseInt(rules[1]) + " characters.";
                            if (rules.length > 2) {
                                if (ValidationFailed === 0) AddMessage(ele, message, rules[2]);
                            }
                            else {
                                if (ValidationFailed === 0) AddMessage(ele, message);
                            }
                            ValidationFailed++;
                        }
                    }
                    if (rules[0].toLowerCase() === "select") {
                        //console.log("validationg this select box");
                        if (parseInt(rules[1]) === ele.val() || ele.val() === "") {
                            var message = "You need to make a valid selection.";
                            if (rules.length > 2) {
                                if (ValidationFailed === 0) AddMessage(ele, message, rules[2]);
                            }
                            else {
                                if (ValidationFailed === 0) AddMessage(ele, message);
                            }
                            ValidationFailed++;
                        }
                    }
                    if (rules[0].toLowerCase() === "maxlength") {
                        var maxlength = 0;
                        var minlength = 0;
                        if (parseInt(rules[1]) !== undefined) {
                            maxlength = parseInt(rules[1]);
                        }
                        if (parseInt(rules[3]) !== undefined) {
                            minlength = parseInt(rules[3]);
                        }
                        var value = ele.val().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                        var intRegex = /^\d+$/;
                        if (!intRegex.test(value) || value.length > maxlength || value.length < minlength) {
                            var message = "This value must be numeric. 0-9";
                            if (rules.length > 4) {
                                if (ValidationFailed === 0) AddMessage(ele, message, rules[2]);
                            }
                            else {
                                if (ValidationFailed === 0) AddMessage(ele, message);
                            }
                            ValidationFailed++;
                        }
                    }
                    if (rules[0].toLowerCase() === "numeric") {
                        var length = 0;
                        if (parseInt(rules[1]) !== undefined) {
                            length = parseInt(rules[1]);
                        }
                        var value = ele.val().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                        var intRegex = /^\d+$/;
                        if (!intRegex.test(value) || value.length < length) {
                            var message = "This value must be numeric. 0-9";
                            if (rules.length > 2) {
                                if (ValidationFailed === 0) AddMessage(ele, message, rules[2]);
                            }
                            else {
                                if (ValidationFailed === 0) AddMessage(ele, message);
                            }
                            ValidationFailed++;
                        }
                    }
                    if (rules[0].toLowerCase() === "multicheck") {
                        if ($("[name=" + rules[1] + "]:checkbox:checked").length <= 0) {
                            var message = "You need to select at least 1 checkbox.";
                            if (ValidationFailed === 0) AddMessage(ele, message);
                            ValidationFailed++;
                        }
                    }
                    if (rules[0].toLowerCase() === "custom") {
                        var fn = window[rules[1]];
                        if (typeof fn === 'function') {
                            if (!fn(ele)) {
                                var message = "Invalid input.";
                                if (ValidationFailed === 0) AddMessage(ele, message);
                                ValidationFailed++;
                            }
                        }

                    }
                }
                else {
                    if (prule[0].toLowerCase() === "checked") {
                        if (!ele.is(':checked')) {
                            var message = "You must check this box to procceed.";
                            if (ValidationFailed === 0) AddMessage(ele, message);
                            ValidationFailed++;
                        }
                    }
                    if (prule[0].toLowerCase() === "email") {
                        if (!ele.val().contains(".") || !ele.val().contains("@") || ele.value < 6) {
                            var message = "Please enter a valid email address.";
                            if (ValidationFailed === 0) AddMessage(ele, message);
                            ValidationFailed++;
                        }
                    }
                    if (prule[0].toLowerCase() === "numeric") {
                        var message = "You must type only numbers in this box.";

                        var value = ele.val().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                        var intRegex = /^\d+$/;

                        if (!intRegex.test(value)) {
                            if (ValidationFailed === 0) AddMessage(ele, message);
                            ValidationFailed++;
                        }
                    }
                    if (prule[0].toLowerCase() === "fullname") {
                        if (!ele.val().trim().contains(" ") || ele.val().length < 6) {
                            var message = "Please provide a full name (both first and last)";
                            if (ValidationFailed === 0) AddMessage(ele, message);
                            ValidationFailed++;
                        }
                    }
                }
                if (ValidationFailed === 0) {
                    me.ElementPassed.raiseEvent(ele);
                    RemoveMessage(ele);
                }
            }

        }
        if (ValidationFailed === 0) return true;
        else return false;
    }
    function FailedValidationElement() {
        this.Element = {};
        this.Message = "";
        this.Position = "";
    }
    function RemoveMessage(ele) {
        //var vid = ele.data("validationMessageId");
        //if (vid !== undefined && vid !== "") {
        //    console.log("removing message " + vid);
        //    $("#ValidationMessage_" + vid).remove();
        //    ele.removeClass("failedValidation");
        //}

    }
    function AddMessage(ele, message, position) {
        //console.log(message);
        var mess = new FailedValidationElement();
        mess.Message = message;
        mess.Element = ele;
        mess.Position = position;
        me.ValidationMessages.push(mess);
        me.ElementFailed.raiseEvent(mess)
    }
}

/* Events */
function Event() {
    var eme = this;
    this.handlers = [];
    this.addHandler = function (handle) {
        //alert("adding handler");
        eme.handlers.push(handle);
    }
    this.unsubscribe = function (handle) {
        for (var i = 0; i < eme.handlers.length; i++) {
            if (JSON.stringify(eme.handlers[i]) === JSON.stringify(handle)) {
                eme.handlers.splice(i, 1);
            }
        }
    }
    this.raiseEvent = function (data) {
        for (var i = 0; i < eme.handlers.length; i++) {
            //alert("raising event #" + i);
            eme.handlers[i](data);
        }
    }
}
