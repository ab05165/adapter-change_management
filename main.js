// Import built-in Node.js package path.
const path = require('path');

/**
 * Import the ServiceNowConnector class from local Node.js module connector.js
 *   and assign it to constant ServiceNowConnector.
 * When importing local modules, IAP requires an absolute file reference.
 * Built-in module path's join method constructs the absolute filename.
 */
const ServiceNowConnector = require(path.join(__dirname, '/connector.js'));

/**
 * Import built-in Node.js package events' EventEmitter class and
 * assign it to constant EventEmitter. We will create a child class
 * from this class.
 */
const EventEmitter = require('events').EventEmitter;

/**
 * The ServiceNowAdapter class.
 *
 * @summary ServiceNow Change Request Adapter
 * @description This class contains IAP adapter properties and methods that IAP
 *   brokers and products can execute. This class inherits the EventEmitter
 *   class.
 */
class ServiceNowAdapter extends EventEmitter {

  /**
   * Here we document the ServiceNowAdapter class' callback. It must follow IAP's
   *   data-first convention.
   * @callback ServiceNowAdapter~requestCallback
   * @param {(object|string)} responseData - The entire REST API response.
   * @param {error} [errorMessage] - An error thrown by REST API call.
   */

  /**
   * Here we document the adapter properties.
   * @typedef {object} ServiceNowAdapter~adapterProperties - Adapter
   *   instance's properties object.
   * @property {string} url - ServiceNow instance URL.
   * @property {object} auth - ServiceNow instance credentials.
   * @property {string} auth.username - Login username.
   * @property {string} auth.password - Login password.
   * @property {string} serviceNowTable - The change request table name.
   */

  /**
   * @memberof ServiceNowAdapter
   * @constructs
   *
   * @description Instantiates a new instance of the Itential ServiceNow Adapter.
   * @param {string} id - Adapter instance's ID.
   * @param {ServiceNowAdapter~adapterProperties} adapterProperties - Adapter instance's properties object.
   */
  constructor(id, adapterProperties) {
    // Call super or parent class' constructor.
    super();
    // Copy arguments' values to object properties.
    this.id = id;
    this.props = adapterProperties;
    // Instantiate an object from the connector.js module and assign it to an object property.
    this.connector = new ServiceNowConnector({
      url: this.props.url,
      username: this.props.auth.username,
      password: this.props.auth.password,
      serviceNowTable: this.props.serviceNowTable
    });
  }

  /**
   * @memberof ServiceNowAdapter
   * @method connect
   * @summary Connect to ServiceNow
   * @description Complete a single healthcheck and emit ONLINE or OFFLINE.
   *   IAP calls this method after instantiating an object from the class.
   *   There is no need for parameters because all connection details
   *   were passed to the object's constructor and assigned to object property this.props.
   */
  connect() {
    // As a best practice, Itential recommends isolating the health check action
    // in its own method.
    this.healthcheck();
  }

  /**
 * @memberof ServiceNowAdapter
 * @method healthcheck
 * @summary Check ServiceNow Health
 * @description Verifies external system is available and healthy.
 *   Calls method emitOnline if external system is available.
 *
 * @param {ServiceNowAdapter~requestCallback} [callback] - The optional callback
 *   that handles the response.
 */
 healthcheck(callback) {
   this.getRecord((result, error) => {
   /**
    * For this lab, complete the if else conditional
    * statements that check if an error exists
    * or the instance was hibernating. You must write
    * the blocks for each branch.
    */
    if (error) {
     /**
      * Write this block.
      * If an error was returned, we need to emit OFFLINE.
      * Log the returned error using IAP's global log object
      * at an error severity. In the log message, record
      * this.id so an administrator will know which ServiceNow
      * adapter instance wrote the log message in case more
      * than one instance is configured.
      * If an optional IAP callback function was passed to
      * healthcheck(), execute it passing the error seen as an argument
      * for the callback's errorMessage parameter.
      */
    
        this.emitOffline();
        console.error(`\nError returned:\n${JSON.stringify(error)} for service instance ` + this.id );
        
        if ( callback !== null && ( callback.errorMessage !== null || callback.errorMessage ) ){
            console.error(`\nHealthCheck :\n${JSON.stringify(callback.errorMessage)} for service instance ` + this.id );
        }
    } else if (result !== null && result.body.includes('Instance Hibernating page')) {

        error = 'Service Now instance is hibernating';
        this.emitOffline();
        console.error(`\nError returned:\n${JSON.stringify(error)} for service instance ` + this.id );

    }else {
     /**
      * Write this block.
      * If no runtime problems were detected, emit ONLINE.
      * Log an appropriate message using IAP's global log object
      * at a debug severity.
      * If an optional IAP callback function was passed to
      * healthcheck(), execute it passing this function's result
      * parameter as an argument for the callback function's
      * responseData parameter.
      */
      this.emitOnline();
        console.debug(`\nError returned:\n${JSON.stringify(result)} for service instance ` + this.id );
        
        if ( callback !== null && ( result.responseData !== null || result.responseData ) ){
            console.error(`\nHealthCheck :\n${JSON.stringify(result.responseData)} for service instance ` + this.id );
        }
    }
  });
 }

  /**
   * @memberof ServiceNowAdapter
   * @method emitOffline
   * @summary Emit OFFLINE
   * @description Emits an OFFLINE event to IAP indicating the external
   *   system is not available.
   */
  emitOffline() {
    this.emitStatus('OFFLINE');
    log.warn('ServiceNow: Instance is unavailable.');
  }

  /**
   * @memberof ServiceNowAdapter
   * @method emitOnline
   * @summary Emit ONLINE
   * @description Emits an ONLINE event to IAP indicating external
   *   system is available.
   */
  emitOnline() {
    this.emitStatus('ONLINE');
    log.info('ServiceNow: Instance is available.');
  }

  /**
   * @memberof ServiceNowAdapter
   * @method emitStatus
   * @summary Emit an Event
   * @description Calls inherited emit method. IAP requires the event
   *   and an object identifying the adapter instance.
   *
   * @param {string} status - The event to emit.
   */
  emitStatus(status) {
    this.emit(status, { id: this.id });
  }

  /**
   * @memberof ServiceNowAdapter
   * @method getRecord
   * @summary Get ServiceNow Record
   * @description Retrieves a record from ServiceNow.
   *
   * @param {ServiceNowAdapter~requestCallback} callback - The callback that
   *   handles the response.
   */
  getRecord(callback) {
     // modify data get connector data to see:
     //1. check for data in body, if so parse to json // TODO look up
     //2. result will have a an array of objects, for each array  get the following:
     /*
        number
        active
        priority
        description
        work_start
        work_end
        sys_id

        For each object in the array, rename key number to change_ticket_number.

For each object in the array, rename key sys_id to change_ticket_key.

Return the array of objects.
     */
     /*
    const response = this.connector.get( callback );
     var modifiedResponse =[];
     if( response !== null && (  response.data.body  != null && response.data.body !== 'undefined') ){
         if ( response.data.body !== null && response.data.body.result !== null ){
             var resultArray = response.data.body.result;
             var i;
             for ( i =0 ; i < resultArray.length ; i++ ){
                 var mapResponse = {
                                change_ticket_number: resultArray[i].number,
                                active : resultArray[i].active,
                                priority : resultArray[i].priority,
                                description : resultArray[i].description,
                                work_start : resultArray[i].work_start,
                                work_end :  resultArray[i].work_end,
                                change_ticket_key : resultArray[i].sys_id
                };
                modifiedResponse.push(mapResponse);
         }
     }
    }
   return  {modifiedResponse , callback}; 
   */
   //this.connector.get( ( results, errors ) => callback (results, errors));
  /* this.getModifiedResponse( (results, errors ) =>{
      this.connector.get( ( results, errors ) => callback (results, errors));
  });
  */
  return  this.connector.get( callback );
  }


  /**
   * @memberof ServiceNowAdapter
   * @method postRecord
   * @summary Create ServiceNow Record
   * @description Creates a record in ServiceNow.
   *
   * @param {ServiceNowAdapter~requestCallback} callback - The callback that
   *   handles the response.
   */
  postRecord(callback) {
      /*
  const response = this.connector.post(connector.options, callback );
  var modifiedResponse ={};
     if( response !== null && (  response.data  != null && response.results !== 'undefined') ){
         if ( response.data.body !== null  && response.data.body.result !== null ){
             var resultArray = response.data.body.result;
             var i;
             for ( i =0 ; i < resultArray.length ; i++ ){
                 var mapResponse = {
                                change_ticket_number: resultArray[i].number,
                                active : resultArray[i].active,
                                priority : resultArray[i].priority,
                                description : resultArray[i].description,
                                work_start : resultArray[i].work_start,
                                work_end :  resultArray[i].work_end,
                                change_ticket_key : resultArray[i].sys_id
                };
                modifiedResponse.push(mapResponse);
         }
     }
    }
     return  {modifiedResponse , callback};*/
      return  this.connector.post(connector.options, callback );
  } 
/*
getModifiedResponse( callback ){
        var modifiedResponse =[];
        if( callback.data !== null && (  callback.data.body !== 'undefined' || callback.data.body  != null ) ){
            if ( callback.data.body.result !== null ){
                var resultArray = callback.data.body.result;
                var i;
                for ( i =0 ; i < resultArray.length ; i++ ){
                    var mapResponse = {
                                    change_ticket_number: resultArray[i].number,
                                    active : resultArray[i].active,
                                    priority : resultArray[i].priority,
                                    description : resultArray[i].description,
                                    work_start : resultArray[i].work_start,
                                    work_end :  resultArray[i].work_end,
                                    change_ticket_key : resultArray[i].sys_id
                    };
                    console.log( 'got to pushing in array');
                    modifiedResponse.push(mapResponse);
                }
            }

        }
    callback.data =  modifiedResponse;
}
*/
  
}


module.exports = ServiceNowAdapter;