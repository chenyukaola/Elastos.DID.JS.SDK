/*
 * Copyright (c) 2021 Elastos Foundation
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { DID, DIDURL, DIDStore } from "../dist/did";

const verifyNewDidCreation = (valueToValidate: string) =>{
	let url: DIDURL = DIDURL.newWithDID(null, valueToValidate);
	expect(url.toString()).toBe(valueToValidate);
}

describe('DIDURL Tests', () => {
	let testDID = "did:elastos:icJ4z2DULrHEzYSvjKNJpKyhqFDxvYV7pN";
	let params = ";elastos:foo=testvalue;bar=123;keyonly;elastos:foobar=12345";
	let path = "/path/to/the/resource";
	let query = "?qkey=qvalue&qkeyonly&test=true";
	let fragment = "#testfragment";
	let testURL = testDID + params + path + query + fragment;

	let did: DID;
	let url: DIDURL;

	beforeEach(()=>{
		did = new DID(testDID);
		url = DIDURL.newWithUrl(testURL);
	})

	test('Test Constructor with Canonical URL', () => {
		verifyNewDidCreation(testDID)

		verifyNewDidCreation(testDID + params)

		verifyNewDidCreation(testDID + path)

		verifyNewDidCreation(testDID + query)

		verifyNewDidCreation(testDID + fragment)

		verifyNewDidCreation(testDID + params + path)

		verifyNewDidCreation(testDID + params + path + query)

		verifyNewDidCreation(testDID + params + path + query + fragment)

		verifyNewDidCreation(testDID + path + query + fragment)

		verifyNewDidCreation(testDID + params + query + fragment)

		verifyNewDidCreation(testDID + params + path + fragment)

		verifyNewDidCreation(testDID + params + path + query)

	});

	test('Test Constructor with Relative URL', () => {

		verifyNewDidCreation(params)

		verifyNewDidCreation(path)

		verifyNewDidCreation(query)

		verifyNewDidCreation(fragment)

		verifyNewDidCreation(params + path)

		verifyNewDidCreation(params + path + query)

		verifyNewDidCreation(params + path + query + fragment)

		verifyNewDidCreation(path + query + fragment)

		verifyNewDidCreation(params + query + fragment)

		verifyNewDidCreation(params + path + fragment)

		verifyNewDidCreation(params + path + query)
	});


	test('Test compatible with plain fragment', () => {

		let testURL = testDID + "#test";
		let url = DIDURL.newWithUrl(testURL);

		expect(url.toString()).toBe(testURL);
		expect(url.getFragment()).toBe("test");

		url = DIDURL.newWithDID(did, "test")

		expect(url.toString()).toBe(testURL);
		expect(url.getFragment()).toBe("test");

		url = DIDURL.newWithUrl("test")
		expect(url.getFragment()).toBe("test");

	});


	test('Test Constructor Error 1', () => {
		expect(() => {DIDURL.newWithUrl("did:elastos:1234567890;" + params + path + query + fragment)}).toThrowError();
	})

	test('Test Constructor Error 2', () => {

		expect(() => {DIDURL.newWithUrl("did:example:1234567890" + params + path + query + fragment)}).toThrowError();
	})

	test('Test Constructor Error 3', () => {

		expect(() => {DIDURL.newWithUrl("did:elastos::1234567890" + params + path + query + fragment)}).toThrowError();
	})

	test('Test Constructor Error 4', () => {

		expect(() => {DIDURL.newWithUrl("did:example:1234567890" + params + path + "?" + "#" + fragment)}).toThrowError();
	})

	test('Test Constructor Error 5', () => {

		expect(() => {DIDURL.newWithUrl("did:example:1234567890" + params + path + query + "#")}).toThrowError();
	})

	

	test('Test GetDID', () => {
		expect(url.getDid().toString()).toBe(testDID);
	})

	test('Test GetParameters', () => {
		expect(url.getParametersString()).toBe(params.substring(1));
	})

	test('Test GetParameter', () => {
		expect(url.getParameter("elastos:foo")).toBe("testvalue");
		expect(url.getParameter("foo")).toBeUndefined();
		expect(url.getParameter("bar")).toBe("123");
		expect(url.getParameter("elastos:foobar")).toBe("12345");
		expect(url.getParameter("foobar")).toBeUndefined();
		expect(url.getParameter("keyonly")).toBeNull();
	})

	test('Test HasParameter', () => {
		expect(url.hasParameter("elastos:foo")).toBeTruthy();
		expect(url.hasParameter("bar")).toBeTruthy();
		expect(url.hasParameter("elastos:foobar")).toBeTruthy();
		expect(url.hasParameter("keyonly")).toBeTruthy();


		expect(url.hasParameter("notexist")).toBeFalsy();
		expect(url.hasParameter("foo")).toBeFalsy();
		expect(url.hasParameter("boobar")).toBeFalsy();
	})


	test('Test GetPath', () => {
		expect(url.getPath()).toBe(path);
	})


	test('Test GetQuery', () => {
		expect(url.getQueryString()).toBe(query.substring(1));
	})


	test('Test GetQueryParameter', () => {
		expect(url.getQueryParameter("qkey")).toBe("qvalue");
		expect(url.getQueryParameter("test")).toBe("true");
		expect(url.getQueryParameter("qkeyonly")).toBeNull();
	})

	test('Test HasQueryParameter', () => {
		expect(url.hasQueryParameter("qkeyonly")).toBeTruthy();
		expect(url.hasQueryParameter("qkey")).toBeTruthy();
		expect(url.hasQueryParameter("test")).toBeTruthy();

		expect(url.hasQueryParameter("notexist")).toBeFalsy();
	})

	test('Test GetFragment', () => {
		expect(url.getFragment()).toBe(fragment.substring(1));
	})

	test('Test ToString', () => {
		expect(url.toString()).toBe(testURL);
	})

	test('Test HashCode', () => {
		let other = DIDURL.newWithUrl(testURL);
		expect(other.hashCode()).toBe(url.hashCode());

		other = DIDURL.newWithUrl("did:elastos:1234567890#test");
		expect(other.hashCode()).not.toBe(url.hashCode());
	})

	test('Test Equals', () => {
		let other = DIDURL.newWithUrl(testURL);


		expect(url.equals(other)).toBeTruthy()
		expect(url.equals(testURL)).toBeTruthy()

		other = DIDURL.newWithUrl("did:elastos:1234567890#test");
		expect(url.equals(other)).toBeFalsy();
		expect(url.equals("did:elastos:1234567890#test")).toBeFalsy()

	})

})

/* public class DIDURLTest {
	private static final String testDID = "did:elastos:icJ4z2DULrHEzYSvjKNJpKyhqFDxvYV7pN";
	private static final String params = ";elastos:foo=testvalue;bar=123;keyonly;elastos:foobar=12345";
	private static final String path = "/path/to/the/resource";
	private static final String query = "?qkey=qvalue&qkeyonly&test=true";
	private static final String fragment = "#testfragment";
	private static final String testURL = testDID + params + path + query + fragment;

	private DID did;
	private DIDURL url;

    @BeforeEach
    public void setup() throws MalformedDIDURLException {
    	did = new DID(testDID);
    	url = new DIDURL(testURL);
    }

	@Test
	public void testConstructorWithCanonicalURL() throws MalformedDIDURLException {
		String testURL = testDID;
		DIDURL url = new DIDURL(testURL);
		assertEquals(testURL, url.toString());

		testURL = testDID + params;
		url = new DIDURL(testURL);
		assertEquals(testURL, url.toString());

		testURL = testDID + path;
		url = new DIDURL(testURL);
		assertEquals(testURL, url.toString());

		testURL = testDID + query;
		url = new DIDURL(testURL);
		assertEquals(testURL, url.toString());

		testURL = testDID + fragment;
		url = new DIDURL(testURL);
		assertEquals(testURL, url.toString());

		testURL = testDID + params + path;
		url = new DIDURL(testURL);
		assertEquals(testURL, url.toString());

		testURL = testDID + params + path + query;
		url = new DIDURL(testURL);
		assertEquals(testURL, url.toString());

		testURL = testDID + params + path + query + fragment;
		url = new DIDURL(testURL);
		assertEquals(testURL, url.toString());

		testURL = testDID + path + query + fragment;
		url = new DIDURL(testURL);
		assertEquals(testURL, url.toString());

		testURL = testDID + params + query + fragment;
		url = new DIDURL(testURL);
		assertEquals(testURL, url.toString());

		testURL = testDID + params + path + fragment;
		url = new DIDURL(testURL);
		assertEquals(testURL, url.toString());

		testURL = testDID + params + path + query;
		url = new DIDURL(testURL);
		assertEquals(testURL, url.toString());
	}

	@Test
	public void testConstructorWithBaseAndRelativeURL() throws MalformedDIDURLException {
		String testURL = testDID;
		DIDURL url = new DIDURL(testURL);
		assertEquals(testURL, url.toString());

		testURL = testDID + params;
		url = new DIDURL(did, params);
		assertEquals(testURL, url.toString());

		testURL = testDID + path;
		url = new DIDURL(did, path);
		assertEquals(testURL, url.toString());

		testURL = testDID + query;
		url = new DIDURL(did, query);
		assertEquals(testURL, url.toString());

		testURL = testDID + fragment;
		url = new DIDURL(did, fragment);
		assertEquals(testURL, url.toString());

		testURL = testDID + params + path;
		url = new DIDURL(did, params + path);
		assertEquals(testURL, url.toString());

		testURL = testDID + params + path + query;
		url = new DIDURL(did, params + path + query);
		assertEquals(testURL, url.toString());

		testURL = testDID + params + path + query + fragment;
		url = new DIDURL(did, params + path + query + fragment);
		assertEquals(testURL, url.toString());

		testURL = testDID + path + query + fragment;
		url = new DIDURL(did, path + query + fragment);
		assertEquals(testURL, url.toString());

		testURL = testDID + params + query + fragment;
		url = new DIDURL(did, params + query + fragment);
		assertEquals(testURL, url.toString());

		testURL = testDID + params + path + fragment;
		url = new DIDURL(did, params + path + fragment);
		assertEquals(testURL, url.toString());

		testURL = testDID + params + path + query;
		url = new DIDURL(did, params + path + query);
		assertEquals(testURL, url.toString());
	}

	@Test
	public void testConstructorWithRelativeURL() throws MalformedDIDURLException {
		String testURL = params;
		url = new DIDURL(params);
		assertEquals(testURL, url.toString());

		testURL = path;
		url = new DIDURL(path);
		assertEquals(testURL, url.toString());

		testURL = query;
		url = new DIDURL(query);
		assertEquals(testURL, url.toString());

		testURL = fragment;
		url = new DIDURL(fragment);
		assertEquals(testURL, url.toString());

		testURL = params + path;
		url = new DIDURL(params + path);
		assertEquals(testURL, url.toString());

		testURL = params + path + query;
		url = new DIDURL(params + path + query);
		assertEquals(testURL, url.toString());

		testURL = params + path + query + fragment;
		url = new DIDURL(params + path + query + fragment);
		assertEquals(testURL, url.toString());

		testURL = path + query + fragment;
		url = new DIDURL(path + query + fragment);
		assertEquals(testURL, url.toString());

		testURL = params + query + fragment;
		url = new DIDURL(params + query + fragment);
		assertEquals(testURL, url.toString());

		testURL = params + path + fragment;
		url = new DIDURL(params + path + fragment);
		assertEquals(testURL, url.toString());

		testURL = params + path + query;
		url = new DIDURL(params + path + query);
		assertEquals(testURL, url.toString());
	}

	@Test
	public void testCompatibleWithPlainFragment() {
		String testURL = testDID + "#test";
		DIDURL url = new DIDURL(testURL);
		assertEquals(testURL, url.toString());
		assertEquals("test", url.getFragment());

		url = new DIDURL(did, "test");
		assertEquals(testURL, url.toString());
		assertEquals("test", url.getFragment());

		url = new DIDURL("test");
		assertEquals("test", url.getFragment());
	}

	@Test
	public void testConstructorError1() {
		assertThrows(MalformedDIDURLException.class, () -> {
			new DIDURL("did:elastos:1234567890;" + params + path + query + fragment);
		});
	}

	@Test
	public void testConstructorError2() {
		assertThrows(MalformedDIDURLException.class, () -> {
			new DIDURL("did:example:1234567890" + params + path + query + fragment);
		});
	}

	@Test
	public void testConstructorError3() {
		assertThrows(MalformedDIDURLException.class, () -> {
			new DIDURL("did:elastos::1234567890" + path + query + fragment);
		});
	}

	@Test
	public void testConstructorError4() {
		assertThrows(MalformedDIDURLException.class, () -> {
			new DIDURL("did:example:1234567890" + params + path + "?" + "#" + fragment);
		});
	}

	@Test
	public void testConstructorError5() {
		assertThrows(MalformedDIDURLException.class, () -> {
			new DIDURL("did:example:1234567890" + params + path + query + "#");
		});
	}

	@Test
	public void testGetDid() {
		assertEquals(testDID, url.getDid().toString());
	}

	@Test
	public void testGetParameters() {
		assertEquals(params.substring(1), url.getParametersString());
	}

	@Test
	public void testGetParameter() {
		assertEquals("testvalue", url.getParameter("elastos:foo"));
		assertNull(url.getParameter("foo"));
		assertEquals("123", url.getParameter("bar"));
		assertEquals("12345", url.getParameter("elastos:foobar"));
		assertNull(url.getParameter("foobar"));
		assertNull(url.getParameter("keyonly"));
	}

	@Test
	public void testHasParameter() {
		assertTrue(url.hasParameter("elastos:foo"));
		assertTrue(url.hasParameter("bar"));
		assertTrue(url.hasParameter("elastos:foobar"));
		assertTrue(url.hasParameter("keyonly"));

		assertFalse(url.hasParameter("notexist"));
		assertFalse(url.hasParameter("foo"));
		assertFalse(url.hasParameter("boobar"));
	}

	@Test
	public void testGetPath() {
		assertEquals(path, url.getPath());
	}

	@Test
	public void testGetQuery() {
		assertEquals(query.substring(1), url.getQueryString());
	}

	@Test
	public void testGetQueryParameter() {
		assertEquals("qvalue", url.getQueryParameter("qkey"));
		assertEquals("true", url.getQueryParameter("test"));
		assertNull(url.getQueryParameter("qkeyonly"));
	}

	@Test
	public void testHasQueryParameter() {
		assertTrue(url.hasQueryParameter("qkeyonly"));
		assertTrue(url.hasQueryParameter("qkey"));
		assertTrue(url.hasQueryParameter("test"));

		assertFalse(url.hasQueryParameter("notexist"));
	}

	@Test
	public void testGetFragment() {
		assertEquals(fragment.substring(1), url.getFragment());
	}

	@Test
	public void testToString() {
		assertEquals(testURL, url.toString());
	}

	@Test
	public void testHashCode() throws MalformedDIDURLException {
		DIDURL other = new DIDURL(testURL);
		assertEquals(url.hashCode(), other.hashCode());

		other = new DIDURL("did:elastos:1234567890#test");
		assertNotEquals(url.hashCode(), other.hashCode());
	}

	@SuppressWarnings("unlikely-arg-type")
	@Test
	public void testEquals() throws MalformedDIDURLException {
		DIDURL other = new DIDURL(testURL);
		assertTrue(url.equals(other));
		assertTrue(url.equals(testURL));

		other = new DIDURL("did:elastos:1234567890#test");
		assertFalse(url.equals(other));
		assertFalse(url.equals("did:elastos:1234567890#test"));
	}
}
 */