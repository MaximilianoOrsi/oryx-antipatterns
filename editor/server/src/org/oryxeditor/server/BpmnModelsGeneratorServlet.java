package org.oryxeditor.server;

import java.io.IOException;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.core.MediaType;

import com.sun.jersey.api.client.Client;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.core.util.MultivaluedMapImpl;

public class BpmnModelsGeneratorServlet extends HttpServlet {
	
	private static final long serialVersionUID = 730839148324562928L;
	

	protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {

		String numberOfModels = req.getParameter("numberOfModels"); 
		String minElements = req.getParameter("minElements"); 
		String maxElements = req.getParameter("maxElements"); 
		String maxBranching = req.getParameter("maxBranching"); 
		String maxNesting = req.getParameter("maxNesting"); 
		String maxSequence = req.getParameter("maxSequence"); 
		String maxNestingOfSubprocesses = req.getParameter("maxNestingOfSubprocesses"); 
		res.setContentType("application/json");
		
		
		MultivaluedMapImpl values = new MultivaluedMapImpl();
		values.add("numberOfModels", numberOfModels);
		values.add("minElements", minElements);
		values.add("maxElements", maxElements);
		values.add("maxBranching", maxBranching);
		values.add("maxNesting", maxNesting);
		values.add("maxSequence", maxSequence);
		values.add("maxNestingOfSubprocesses", maxNestingOfSubprocesses);		
		
		Client client = Client.create();
		//WebResource webResource = client.resource("http://bpmn-jmr03.rhcloud.com/tools/modelsgenerator");
		WebResource webResource = client.resource("http://localhost:8081/bpmn/tools/modelsgenerator");
		ClientResponse response = webResource
				.type(MediaType.APPLICATION_FORM_URLENCODED)
				.post(ClientResponse.class, values);
		
		if (response.getStatus() != 200) {
			res.sendError(response.getStatus());
		}
		else{
			String result = response.getEntity(String.class);
			res.getWriter().print(result);	
		}	
	}	
	
}
