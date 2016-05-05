package org.oryxeditor.server;

import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class ExportAllServlet extends HttpServlet {
	
	private static final long serialVersionUID = 730839148324562928L;
	

	protected void doPost(HttpServletRequest req, HttpServletResponse res) {

		String modelsAsString = req.getParameter("modelsAsString"); 
	
		try {
			JSONArray models = new JSONArray(modelsAsString);
			
			String dir = "C:/Users/maxio/Desktop/models/";
			Path pathDir = Paths.get(dir);
			Files.createDirectories(pathDir);
			for(int i=0; i<models.length(); i++){
				JSONObject model = new JSONObject(models.getString(i));
				String modelName = model.getString("modelName");
				String modelData = model.getString("modelData");
				
				String file = dir + modelName + ".txt";
				Path filePath = Paths.get(file);
				List<String> lines = Arrays.asList(modelData);
				Files.write(filePath, lines, Charset.forName("UTF-8"));
			}
		} catch (JSONException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}	
	}	
	
}
