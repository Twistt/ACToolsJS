# ACToolsJS
A collection of JavaScript tools for properly architecting the FRONT end with clear defined event driven patterns.


ACValidationEvents.JS

## Usage:
MVC: 
    
      @Html.TextBoxFor(m => m.PhonePrefix, new { @class = "field text", value = "", size = "3", maxlength = "3", tabindex = "8", required = "true", type = "tel", data_validation = "numeric:3:bottom", data_validation_message = "3 chars <br> (numeric)" })
      
HTML: 
     
      <select id="Initiator" name="Initiator" class="field select medium" tabindex="11" data-validation="length:2" data-validation-message="You must choose a value.">
      
## Additional Info:
      "Right" alignment is default. Supported validation message alignments are "Bottom" or none for right;

 ## Supported Properties:
        numeric:n
        numeric:n:bottom
        maxlength:n:minlength:n
        maxlength:x:minlength:y:bottom
        length:n
        length:n:bottom
        email <== contains @ and . minimum of 8 chars
        fullname <==(expects 2 distinct words with a space seperation 2 characters min [for each word])
        multicheck:nameofcheckboxgroup <==(can be applied to the PARENT element of a group of checkboxes.[this will get all checkboxes by that name contained within])
        custom: funcValidateCustom <==(use for custom validation functions it will call this function with the source element as the parameter and your function should return true or false.)
        checkbox
        button <==(applies a click handler to the element - use to tell where the final validation and then submit action should occur.)
        select:'defaultvalue' <== default value to ignore - such as "--" and "select"
        select:'defaultvalue':bottom

## Authors

* **William Harris** - *Initial work* - [Arachnid Creations, Inc.](https://github.com/Twistt/ACToolsJS/)
