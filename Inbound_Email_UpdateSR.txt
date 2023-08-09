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

function update_servicerequest(incident_data){
	
	
	//sc_item_option.item_option_new.sys_id=24dcfb171b742d14ee0743f3cc4bcb99^sc_item_option.value=105
	
	// 1. Look for the question order number, and find the question that has the matching order number to the inbound email (The order number sys id is unique, only used for this SR)
	// 2. Pull the sc_req_item number from that question
	// 3. Search for sc_req_item number from #2, and the order status field, and retrieve sc_item_option sysid
	// 4. Use the value retrived in #3 to search sc_item_option table and update the field value
	var gr = new GlideRecord('sc_item_option_mtom');
	gr.addEncodedQuery('sc_item_option.item_option_new.sys_id=24dcfb171b742d14ee0743f3cc4bcb99^sc_item_option.value=' + incident_data.order_number);
	gr.query();
	
	while (gr.next()){
		
		var sc_req_item = gr.getValue('request_item');
	
		gs.log('DSF: request item: ' + sc_req_item);
	
		var grc = new GlideRecord('sc_item_option_mtom');
		grc.addEncodedQuery('request_item.sys_id='+ sc_req_item + '^sc_item_option.item_option_new.question_text=order status');
		grc.query();
		
		gs.log('DSF : Order Number found : ' + grc.getRowCount());
		if (grc.next()){
			
			var sc_item_option = grc.getValue('sc_item_option');
			gs.log('DSF : item option value'  );
			
			var grd = new GlideRecord('sc_item_option');
			grd.query('sys_id', sc_item_option);
			grd.query();
			
			if (grd.next()){
				
				grd.setValue('value', incident_data.order_status);
				grd.update();
				
			} // end if
				
		} // end if
	
	} // end while
	
	return sc_req_item;
}


function updatetask_worknotes(sc_req_item){
	
	var ritm_sysid = sc_req_item;
	
	var grt = new GlideRecord('sc_task');
	grt.addEncodedQuery('request_item.sys_id=' + ritm_sysid);
	grt.query();
	
	//gs.log('DSF: task found: rowcount: ' + grt.getRowCount());
	
		while (grt.next()){
			
			gs.log('DSF: task found: task sysid: ' + grt.getValue('sys_id'));
			
			grt.work_notes = email.body_text +"\n"+"\n";
			grt.update();
			
		}
	
}	


function main_function(){
	
	gs.log('DSF: main function start');
	
	var incident_data = get_positions();
		
	var sc_req_item = update_servicerequest(incident_data); // call create servicerequest and pass in order number and order status
	
	updatetask_worknotes(sc_req_item);
	
} main_function();

	