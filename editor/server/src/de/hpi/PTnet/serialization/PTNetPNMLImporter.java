package de.hpi.PTnet.serialization;

import java.util.Map;

import org.w3c.dom.Node;

import de.hpi.PTnet.PTNet;
import de.hpi.PTnet.PTNetFactory;
import de.hpi.petrinet.PetriNet;
import de.hpi.petrinet.Place;
import de.hpi.petrinet.serialization.PetriNetPNMLImporter;

/**
 * Copyright (c) 2008 Gero Decker
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
public class PTNetPNMLImporter extends PetriNetPNMLImporter {
	
	@Override
	protected PetriNet createPetriNet(Node nnode) {
		return PTNetFactory.eINSTANCE.createPetriNet();
	}

	@Override
	protected Place addPlace(PetriNet net, Node pnode, Map<String, de.hpi.petrinet.Node> map) {
		Place p = super.addPlace(net, pnode, map);
		
		try {
			Node node = getChild(getChild(pnode, "initialMarking"), "value");
			((PTNet)net).getInitialMarking().setNumTokens(p, new Integer(getContent(node)));
		} catch (Exception e) {
		}

		return p;
	}

}
