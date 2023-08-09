// Global vars

var dsf_usersysid = '31884f631baec510335aff7dcc4bcb84';
var ritm_shortdesc = 'Digital StoreFront Email Integration';
var ritm_desc = 'Digital StoreFront Email Integration';
var sc_desc = 'Digital StoreFront Email Integration';
var cat_itemsysid = 'cf5cf7d31b742d14ee0743f3cc4bcb4e';
//sc_shortdesc - is set on the workflow

function get_positions() {

	var label_order_number_pos =  email.body_text.indexOf('Order Number: ');
	var order_text = 'Order Number: ';
	var order_status_text = 'Order Status: ';
	var user_id_text = 'User id: ';
	//var last_string = 'Your order has been placed successfully';
	
	var last_string = 'Thank you for requesting printing through NYC H+H Print Hub Web';
	
	gs.log('DSF: Position, order number label pos: ' + label_order_number_pos);
	
	var order_number_start_pos = (label_order_number_pos + order_text.length);
	gs.log('DSF: Position, order num start pos: ' + order_number_start_pos);
	
	var label_order_status_pos = email.body_text.indexOf('Order Status:');
	gs.log('DSF: Position, order status label pos: ' + label_order_status_pos);

	var label_user_id_pos = email.body_text.indexOf('User id:');
	gs.log('DSF: Position, user id label pos: ' + label_user_id_pos);

	var order_number = email.body_text.substring(order_number_start_pos, label_order_status_pos ).trim();
	gs.log('DSF: Position, order number: ' + order_number);
	
	var order_status_start_pos = (label_order_status_pos + order_status_text.length);
	
	var order_status = email.body_text.substring(order_status_start_pos, label_user_id_pos).trim();
	gs.log('DSF: Position, order status: ' + order_status);
	
	var user_id_start_pos = (label_user_id_pos + user_id_text.length);
	gs.log('DSF: Position, user id start pos: ' + user_id_start_pos);
	
	var last_string_pos = email.body_text.indexOf(last_string);
	gs.log('DSF: Position: last string pos: ' + last_string_pos);
	
	var user_id = email.body_text.substring(user_id_start_pos, last_string_pos).trim();
	gs.log('DSF: Position: user id: ' + user_id);
	
	var incident_data = {order_number: order_number, order_status: order_status, user_id: user_id};

	return incident_data;
}
	
	
function get_data(){
	
	var incident_data = get_positions();
	
	gs.log('DSF: get data ');
	
	//gs.log('DSF: get data: Order number: ' + incident_data.order_number);
	//gs.log('DSF: get data: Order status: ' + incident_data.order_status);
	//gs.log('DSF: get data: Order number: ' + incident_data.user_id);

	return incident_data;
}	
	

function user_lookup(user_id){
	
	
	/* Extract the user id string from the email body, lookup servicenow for this user, and use this to populate the reequested for sys id in the SR/RITM */
	/* If the user is not found then default to the dsf user as the requested for */
	
	/* Input = user_id extraced from the previous function */
	/* Output = user sys_id from the user form  */
	
	gs.log('DSF: user lookup: start: user id: length ' + user_id + 'length: ' + user_id.length);
	
	
	//var user_data = {user_sysid: user_sysid, email: email, location: location, phone: phone };
	
	grc = new GlideRecord('sys_user');
	
	grc.addQuery('user_name', user_id);
	grc.autoSysFields(false);
	grc.setWorkflow(false);
	grc.query();

			if (grc.next()){

				gs.log('DSF: user lookup found: sysid found: ' + grc.sys_id);
			
				var user_sysid = grc.getValue('sys_id');
				var email = grc.getValue('email');
				var location = grc.getValue('location');
				var phone = grc.getValue('phone');
			
			}
	
		else{
				
			user_sysid = dsf_usersysid; // Digital Storefront
			}
		var user_data = {user_sysid: user_sysid, email: email,  location: location, phone: phone };
		return user_data;		
	
	}
	
function create_servicerequest(incident_data){

	JSUtil.logObject(incident_data, 'DSF Inc create: incident data');	
	gs.log('DSF: create incident start');
	
	
	var user_data = user_lookup(incident_data.user_id);
	JSUtil.logObject(user_data, 'DSF Inc create: user_data');


	var user_sysid = user_data.user_sysid;
		
	//gs.log('DSF: Create SR: user sysid: ' + user_sysid);
	//gs.log('DSF: Create SR: user id: ' + incident_data.user_id);
	
	var gr = new GlideRecord('sc_request');
	gr.initialize();
	gr.requested_for = user_sysid;
	gr.opened_by = dsf_usersysid; // Digital storefront
	gr.short_description = sc_desc;
	gr.description = sc_desc;
	gr.order = incident_data.order_number;
	
	var requestsysid = gr.insert();
	
	current.requested_for = user_sysid;
	current.u_requested_for = user_sysid;
	current.opened_by = dsf_usersysid;
	current.short_description = ritm_shortdesc;
	current.description = ritm_desc;
	current.cat_item = cat_itemsysid;
	current.parent = requestsysid;
	current.request = requestsysid;
	
	current.variables.order_number = incident_data.order_number;
	current.order = incident_data.order_number;
	current.variables.order_status = incident_data.order_status;
	
	gs.log('Current var order number: ' + incident_data.order_number);
	gs.log('Current var order status: ' + incident_data.order_status);
	
	
	var ritm_sysid = current.insert();
	gs.log('DSF ritm sysid: ' + ritm_sysid);
	
		
	// populate order number and order status values onto the variables and link with the ritm
	// populate requested for and requested by and additional user variables and link with the ritm
	
	var scopt = new GlideRecord('sc_item_option');
	scopt.initialize();
	scopt.item_option_new = '24dcfb171b742d14ee0743f3cc4bcb99'; //sys_id of varible record // order number
	scopt.value = incident_data.order_number; // variable value
	var varSys_id = scopt.insert();
	//gs.log(' this is sys_id scopt: ' + varSys_id);
	
	var scopt1 = new GlideRecord('sc_item_option_mtom');
	scopt1.initialize();
	scopt1.sc_item_option = varSys_id; // sys_id of the above record
	scopt1.request_item = ritm_sysid; // ritm sys_id
	gs.log(' this is sys_id: scopt1 ' + scopt1.insert());
	
	var scopd = new GlideRecord('sc_item_option');
	scopd.initialize();
	scopd.item_option_new = 'f91dbfd31b742d14ee0743f3cc4bcb6c'; //sys_id of varible record // order status
	scopd.value = incident_data.order_status; // variable value
	var varSys_id_1 = scopd.insert();
	//gs.log(' this is sys_id scopd: ' + varSys_id_1);
	
	var scopd1 = new GlideRecord('sc_item_option_mtom');
	scopd1.initialize();
	scopd1.sc_item_option = varSys_id_1; // sys_id of the above record
	scopd1.request_item = ritm_sysid; // ritm sys_id
	gs.log(' this is sys_id scopt2: ' + scopd1.insert());
	
	// populate requested for
	
	var reqfor = new GlideRecord('sc_item_option');
	reqfor.initialize();
	reqfor.item_option_new = '57f00a09db681fc0039a777a8c9619b0'; //sys_id of varible record // requested for
	reqfor.value = user_sysid; // variable value user_sysid
	var varSys_id_reqfor = reqfor.insert();
	//gs.log(' this is sys_id scopd: ' + varSys_id_reqfor);
	
	var reqfor1 = new GlideRecord('sc_item_option_mtom');
	reqfor1.initialize();
	reqfor1.sc_item_option=varSys_id_reqfor ; // sys_id of the above record
	reqfor1.request_item=ritm_sysid; // ritm sys_id
	gs.log(' this is sys_id reqfor1: ' + reqfor1.insert());
	
	// populate requested for email
	
	var reqforemail = new GlideRecord('sc_item_option');
	reqforemail.initialize();
	reqforemail.item_option_new = '237146c9db681fc0039a777a8c9619b7'; //sys_id of varible record // requested for email
	reqforemail.value = user_data.email; // variable value user_data.email
	var varSys_id_reqforemail = reqforemail.insert();
	//gs.log(' this is reqforemail sysid : ' + varSys_id_reqforemail);
	
	var reqforemail_1 = new GlideRecord('sc_item_option_mtom');
	reqforemail_1.initialize();
	reqforemail_1.sc_item_option=varSys_id_reqforemail ; // sys_id of the above record
	reqforemail_1.request_item=ritm_sysid; // ritm sys_id
	gs.log(' this is sys_id reqfor1: ' + reqforemail_1.insert());
	
	var req_for_loc = new GlideRecord('sc_item_option');
	req_for_loc.initialize();
	req_for_loc.item_option_new = '21e142c9db681fc0039a777a8c9619db'; //sys_id of varible record // requested for location
	req_for_loc.value = user_data.location; // variable value user_data.location
	var varSys_id_req_for_loc = req_for_loc.insert();
	//gs.log(' this is req for loc sysid : ' + varSys_id_req_for_loc);
	
	var req_for_loc_1 = new GlideRecord('sc_item_option_mtom');
	req_for_loc_1.initialize();
	req_for_loc_1.sc_item_option=varSys_id_req_for_loc ; // sys_id of the above record
	req_for_loc_1.request_item=ritm_sysid; // ritm sys_id
	gs.log(' this is sys_id reqfor1: ' + req_for_loc_1.insert());
	
	var req_for_phone = new GlideRecord('sc_item_option');
	req_for_phone.initialize();
	req_for_phone.item_option_new = '31a14ec9db681fc0039a777a8c96196e'; //sys_id of varible record // requested for phone
	req_for_phone.value = user_data.phone; // variable value user_data.phone
	var varSys_id_req_for_phone = req_for_phone.insert();
	//gs.log(' this is req for phone sysid : ' + varSys_id_req_for_phone);
	
	var req_for_phone_1 = new GlideRecord('sc_item_option_mtom');
	req_for_phone_1.initialize();
	req_for_phone_1.sc_item_option=varSys_id_req_for_phone ; // sys_id of the above record
	req_for_phone_1.request_item=ritm_sysid; // ritm sys_id
	gs.log(' this is sys_id reqfor phone 1: ' + req_for_phone_1.insert());
	
	
	// populate requested by
	var reqby = new GlideRecord('sc_item_option');
	reqby.initialize();
	reqby.item_option_new = '50600609db681fc0039a777a8c9619c7'; //sys_id of varible record // requested by	
	reqby.value = dsf_usersysid; //DS
	var varSys_id_reqby = reqby.insert();
	//gs.log(' this is sys_id reqby: ' + varSys_id_reqby);
	
	var reqby1 = new GlideRecord('sc_item_option_mtom');
	reqby1.initialize();
	reqby1.sc_item_option = varSys_id_reqby; // sys_id of the above record
	reqby1.request_item = ritm_sysid; // ritm sys_id
	gs.log(' this is sys_id reqby1: ' + reqby1.insert());
	
	
	var w = new Workflow();
	
	wflow_sysid = w.getWorkflowFromName('Digital Storefront Print Orders');
	w.startFlow(wflow_sysid, current, current.operation());
	
	// Update the catalog task short description
	
	var grt = new GlideRecord('sc_task');
	grt.addEncodedQuery('request_item.sys_id=' + ritm_sysid);
	grt.query();
	
	gs.log('DSF: task found: rowcount: ' + grt.getRowCount());
	
	while (grt.next()){
			
			//gs.log('DSF: task found: task sysid: ' + grt.getValue('sys_id'));
		
			if (user_sysid == dsf_usersysid) {

				
				//gs.log('DSF: Create SR: user if: ' + user_sysid);
			grt.description = email.body_text +"\n"+"\n"+

			'The user id provided: ' + incident_data.user_id  + ' was not found in Servicenow. The requested for has been set to Digital StoreFront'; 
		}
		else{

				//gs.log('DSF: Create SR: user else: ' + user_sysid);

				grt.description =  email.body_text +"\n"+"\n";
			
		}
		grt.update(); 
	
	}
	

}		

function main_function(){
	
	//gs.log('DSF: main function start');
	
	var incident_data = get_positions();
		
	create_servicerequest(incident_data); // call create incident and pass in order number and order status
		
} main_function();

